import { app, BrowserWindow, globalShortcut, ipcMain, screen, shell } from 'electron';
import Store from 'electron-store';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { AuthManager } from './auth-manager';
import { SyncService } from './sync-service';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
}

const store = new Store<{
  windowBounds: WindowBounds;
  notes: any[];
  chatHistory: any[];
  session: any;
  user: any;
  lastSyncTime: number;
  pendingNotes: any[];
  pendingMessages: any[];
}>();

let mainWindow: BrowserWindow | null = null;
let isExpanded = false;
let authManager: AuthManager | null = null;
let syncService: SyncService | null = null;

const BUTTON_SIZE = 60;
const EXPANDED_WIDTH = 400;
const EXPANDED_HEIGHT = 600;
const MARGIN_FROM_EDGE = 20;

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  const savedBounds = store.get('windowBounds');
  const defaultX = screenWidth - BUTTON_SIZE - MARGIN_FROM_EDGE;
  const defaultY = screenHeight - BUTTON_SIZE - MARGIN_FROM_EDGE;

  mainWindow = new BrowserWindow({
    width: savedBounds?.isMinimized ? BUTTON_SIZE : (savedBounds?.width || EXPANDED_WIDTH),
    height: savedBounds?.isMinimized ? BUTTON_SIZE : (savedBounds?.height || EXPANDED_HEIGHT),
    x: savedBounds?.isMinimized ? defaultX : (savedBounds?.x ?? defaultX - EXPANDED_WIDTH + BUTTON_SIZE),
    y: savedBounds?.isMinimized ? defaultY : (savedBounds?.y ?? defaultY - EXPANDED_HEIGHT + BUTTON_SIZE),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  isExpanded = !savedBounds?.isMinimized;

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'react', 'index.html'));
    // Open DevTools in production for debugging
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  if (process.platform === 'win32') {
    mainWindow.setSkipTaskbar(true);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('move', saveWindowState);
  mainWindow.on('resize', saveWindowState);
}

function saveWindowState() {
  if (!mainWindow) return;

  const bounds = mainWindow.getBounds();
  store.set('windowBounds', {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMinimized: !isExpanded
  });
}

function toggleWindow() {
  if (!mainWindow) return;

  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  if (isExpanded) {
    const currentBounds = mainWindow.getBounds();
    store.set('windowBounds', {
      ...currentBounds,
      isMinimized: true
    });

    mainWindow.setBounds({
      x: screenWidth - BUTTON_SIZE - MARGIN_FROM_EDGE,
      y: screenHeight - BUTTON_SIZE - MARGIN_FROM_EDGE,
      width: BUTTON_SIZE,
      height: BUTTON_SIZE
    });

    isExpanded = false;
    mainWindow.webContents.send('window-state-changed', { isExpanded: false });
  } else {
    const savedBounds = store.get('windowBounds');

    // Calculate proper expanded position - centered in available screen space
    const defaultX = Math.max(20, screenWidth - EXPANDED_WIDTH - MARGIN_FROM_EDGE);
    const defaultY = Math.max(20, screenHeight - EXPANDED_HEIGHT - MARGIN_FROM_EDGE);

    // Force use of full expanded size and proper position
    mainWindow.setBounds({
      x: defaultX,
      y: defaultY,
      width: EXPANDED_WIDTH,
      height: EXPANDED_HEIGHT
    });

    // Ensure window is resizable and visible
    mainWindow.setResizable(true);
    mainWindow.show();
    mainWindow.focus();

    isExpanded = true;
    mainWindow.webContents.send('window-state-changed', { isExpanded: true });
  }

  saveWindowState();
}

function focusNoteInput() {
  if (!mainWindow) return;

  if (!isExpanded) {
    toggleWindow();
    setTimeout(() => {
      mainWindow?.webContents.send('focus-note-input');
    }, 300);
  } else {
    mainWindow.webContents.send('focus-note-input');
  }

  mainWindow.focus();
}

app.whenReady().then(async () => {
  createWindow();

  // Initialize auth and sync services
  try {
    authManager = new AuthManager();
    syncService = new SyncService(store as any, authManager.getSupabaseClient());

    // Set up auth state listener
    authManager.onAuthStateChange((session) => {
      if (session) {
        syncService?.setUserId(session.user.id);
        mainWindow?.webContents.send('auth-state-changed', {
          isAuthenticated: true,
          user: session.user
        });
      } else {
        syncService?.setUserId(null);
        mainWindow?.webContents.send('auth-state-changed', {
          isAuthenticated: false,
          user: null
        });
      }
    });

    // Check for existing session
    const existingSession = authManager.getSession();
    if (existingSession) {
      syncService.setUserId(existingSession.user.id);
    }
  } catch (error) {
    console.error('Failed to initialize auth/sync services:', error);
  }

  globalShortcut.register('CommandOrControl+Shift+N', toggleWindow);
  globalShortcut.register('CommandOrControl+Shift+Q', focusNoteInput);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

ipcMain.handle('toggle-window', () => {
  toggleWindow();
});

ipcMain.handle('get-notes', () => {
  return store.get('notes', []);
});

ipcMain.handle('save-note', async (_, note) => {
  if (syncService) {
    return await syncService.saveNoteLocally(note);
  } else {
    // Fallback to local storage only
    const notes = store.get('notes', []);
    notes.unshift(note);
    store.set('notes', notes);
    return notes;
  }
});

ipcMain.handle('delete-note', async (_, noteId) => {
  if (syncService) {
    return await syncService.deleteNoteLocally(noteId);
  } else {
    // Fallback to local storage only
    const notes = store.get('notes', []);
    const updatedNotes = notes.filter(note => note.id !== noteId);
    store.set('notes', updatedNotes);
    return updatedNotes;
  }
});

ipcMain.handle('get-chat-history', () => {
  return store.get('chatHistory', []);
});

ipcMain.handle('save-chat-message', (_, message) => {
  const chatHistory = store.get('chatHistory', []);
  chatHistory.push(message);
  store.set('chatHistory', chatHistory);
  return chatHistory;
});

ipcMain.handle('clear-chat-history', () => {
  store.set('chatHistory', []);
  return [];
});

ipcMain.handle('export-notes', (_, format: 'json' | 'markdown') => {
  const notes = store.get('notes', []);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `notes-export-${timestamp}.${format === 'json' ? 'json' : 'md'}`;

  let content: string;
  if (format === 'json') {
    content = JSON.stringify(notes, null, 2);
  } else {
    content = '# Notes Export\n\n';
    notes.forEach((note: any) => {
      content += `## ${new Date(note.timestamp).toLocaleString()}\n\n`;
      content += `${note.text}\n\n`;
      if (note.tags && note.tags.length > 0) {
        content += `Tags: ${note.tags.join(', ')}\n\n`;
      }
      content += '---\n\n';
    });
  }

  return { fileName, content };
});

ipcMain.handle('get-window-state', () => {
  return { isExpanded };
});

ipcMain.handle('send-to-claude', async (_, message: string, notes: any[], chatHistory: any[]) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('API Key loaded:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT FOUND');

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not found in environment variables');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        system: `You are a helpful AI assistant with access to the user's notes. Here are all the user's notes:\n\n${notes.map((note: any) => `[${new Date(note.timestamp).toLocaleString()}] ${note.text}`).join('\n\n')}\n\nUse this context to help answer questions about their notes.`,
        messages: [
          ...chatHistory.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          })),
          { role: 'user', content: message }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return { success: true, content: data.content[0].text };
  } catch (error: any) {
    console.error('Claude API Error:', error);
    return { success: false, error: error.message };
  }
});

// Authentication handlers
ipcMain.handle('auth-sign-in', async (_, email: string, password: string) => {
  if (!authManager) {
    return { success: false, error: 'Authentication service not available' };
  }
  return await authManager.signIn(email, password);
});

ipcMain.handle('auth-sign-up', async (_, email: string, password: string) => {
  if (!authManager) {
    return { success: false, error: 'Authentication service not available' };
  }
  return await authManager.signUp(email, password);
});

ipcMain.handle('auth-sign-out', async () => {
  if (!authManager) return;
  await authManager.signOut();
});

ipcMain.handle('auth-get-session', () => {
  return authManager?.getSession() || null;
});

ipcMain.handle('auth-get-user', () => {
  return authManager?.getUser() || null;
});

ipcMain.handle('auth-is-authenticated', () => {
  return authManager?.isAuthenticated() || false;
});

// Sync handlers
ipcMain.handle('sync-get-status', () => {
  return syncService?.getSyncStatus() || {
    isOnline: false,
    pendingChanges: 0,
    lastSyncTime: 0,
    isAuthenticated: false
  };
});

ipcMain.handle('sync-force-sync', async () => {
  if (!syncService) return;
  await syncService.forcSync();
});

ipcMain.handle('sync-migrate-data', async () => {
  if (!syncService) {
    throw new Error('Sync service not available');
  }
  await syncService.migrateLocalDataToCloud();
});

// Offline mode
ipcMain.handle('continue-offline', () => {
  // Continue without authentication
  return { success: true };
});
import { app, BrowserWindow, globalShortcut, ipcMain, screen, shell } from 'electron';
import Store from 'electron-store';
import * as path from 'path';

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
}>();

let mainWindow: BrowserWindow | null = null;
let isExpanded = false;

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
    const defaultX = screenWidth - EXPANDED_WIDTH - MARGIN_FROM_EDGE;
    const defaultY = screenHeight - EXPANDED_HEIGHT - MARGIN_FROM_EDGE;

    mainWindow.setBounds({
      x: savedBounds?.x ?? defaultX,
      y: savedBounds?.y ?? defaultY,
      width: savedBounds?.width || EXPANDED_WIDTH,
      height: savedBounds?.height || EXPANDED_HEIGHT
    });

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

app.whenReady().then(() => {
  createWindow();

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

ipcMain.handle('save-note', (_, note) => {
  const notes = store.get('notes', []);
  notes.unshift(note);
  store.set('notes', notes);
  return notes;
});

ipcMain.handle('delete-note', (_, noteId) => {
  const notes = store.get('notes', []);
  const updatedNotes = notes.filter(note => note.id !== noteId);
  store.set('notes', updatedNotes);
  return updatedNotes;
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
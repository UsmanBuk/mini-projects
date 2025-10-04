const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  toggleWindow: () => ipcRenderer.invoke('toggle-window'),
  getWindowState: () => ipcRenderer.invoke('get-window-state'),
  onWindowStateChanged: (callback) => ipcRenderer.on('window-state-changed', (_, data) => callback(data)),
  onFocusNoteInput: (callback) => ipcRenderer.on('focus-note-input', callback),

  getNotes: () => ipcRenderer.invoke('get-notes'),
  saveNote: (note) => ipcRenderer.invoke('save-note', note),
  deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),

  getChatHistory: () => ipcRenderer.invoke('get-chat-history'),
  saveChatMessage: (message) => ipcRenderer.invoke('save-chat-message', message),
  clearChatHistory: () => ipcRenderer.invoke('clear-chat-history'),

  exportNotes: (format) => ipcRenderer.invoke('export-notes', format),
  sendToClaude: (message, notes, chatHistory) => ipcRenderer.invoke('send-to-claude', message, notes, chatHistory),

  // Authentication
  authSignIn: (email, password) => ipcRenderer.invoke('auth-sign-in', email, password),
  authSignUp: (email, password) => ipcRenderer.invoke('auth-sign-up', email, password),
  authSignOut: () => ipcRenderer.invoke('auth-sign-out'),
  authGetSession: () => ipcRenderer.invoke('auth-get-session'),
  authGetUser: () => ipcRenderer.invoke('auth-get-user'),
  authIsAuthenticated: () => ipcRenderer.invoke('auth-is-authenticated'),
  onAuthStateChanged: (callback) => ipcRenderer.on('auth-state-changed', (_, data) => callback(data)),

  // Sync
  syncGetStatus: () => ipcRenderer.invoke('sync-get-status'),
  syncForceSync: () => ipcRenderer.invoke('sync-force-sync'),
  syncMigrateData: () => ipcRenderer.invoke('sync-migrate-data'),

  // Offline mode
  continueOffline: () => ipcRenderer.invoke('continue-offline')
});
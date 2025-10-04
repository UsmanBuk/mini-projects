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

  exportNotes: (format) => ipcRenderer.invoke('export-notes', format)
});
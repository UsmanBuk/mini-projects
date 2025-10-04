export interface Note {
  id: string;
  text: string;
  timestamp: number;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ElectronAPI {
  toggleWindow: () => Promise<void>;
  getWindowState: () => Promise<{ isExpanded: boolean }>;
  onWindowStateChanged: (callback: (data: { isExpanded: boolean }) => void) => void;
  onFocusNoteInput: (callback: () => void) => void;

  getNotes: () => Promise<Note[]>;
  saveNote: (note: Note) => Promise<Note[]>;
  deleteNote: (noteId: string) => Promise<Note[]>;

  getChatHistory: () => Promise<ChatMessage[]>;
  saveChatMessage: (message: ChatMessage) => Promise<ChatMessage[]>;
  clearChatHistory: () => Promise<ChatMessage[]>;

  exportNotes: (format: 'json' | 'markdown') => Promise<{ fileName: string; content: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
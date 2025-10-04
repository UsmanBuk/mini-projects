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

export interface SyncStatus {
  isOnline: boolean;
  pendingChanges: number;
  lastSyncTime: number;
  isAuthenticated: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface User {
  id: string;
  email?: string;
  [key: string]: any;
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
  sendToClaude: (message: string, notes: Note[], chatHistory: ChatMessage[]) => Promise<{ success: boolean; content?: string; error?: string }>;

  // Authentication
  authSignIn: (email: string, password: string) => Promise<AuthResult>;
  authSignUp: (email: string, password: string) => Promise<AuthResult>;
  authSignOut: () => Promise<void>;
  authGetSession: () => Promise<any>;
  authGetUser: () => Promise<User | null>;
  authIsAuthenticated: () => Promise<boolean>;
  onAuthStateChanged: (callback: (data: { isAuthenticated: boolean; user: User | null }) => void) => void;

  // Sync
  syncGetStatus: () => Promise<SyncStatus>;
  syncForceSync: () => Promise<void>;
  syncMigrateData: () => Promise<void>;

  // Offline mode
  continueOffline: () => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
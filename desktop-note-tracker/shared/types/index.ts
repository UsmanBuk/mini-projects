// Shared types for both desktop and web apps

export interface Note {
  id: string;
  user_id: string;
  content: string;
  title?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Database table types (matching Supabase schema)
export interface Database {
  public: {
    Tables: {
      notes: {
        Row: Note;
        Insert: Omit<Note, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Note, 'id' | 'user_id' | 'created_at'>>;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Conversation, 'id' | 'user_id' | 'created_at'>>;
      };
      messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, 'id' | 'timestamp'>;
        Update: Partial<Omit<ChatMessage, 'id' | 'conversation_id'>>;
      };
    };
  };
}

// UI State types
export interface NoteFilters {
  search: string;
  tags: string[];
  dateRange: 'all' | 'today' | 'week' | 'month';
}

export interface ChatState {
  isLoading: boolean;
  currentConversation?: string;
  messages: ChatMessage[];
}

// Form types
export interface CreateNoteForm {
  content: string;
  title?: string;
  tags: string[];
}

export interface AuthForm {
  email: string;
  password: string;
}
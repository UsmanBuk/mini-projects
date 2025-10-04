import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FloatingButton from './components/FloatingButton';
import ExpandedView from './components/ExpandedView';
import LoginScreen from './components/LoginScreen';
import { Note, ChatMessage, User, SyncStatus } from './types';

function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    pendingChanges: 0,
    lastSyncTime: 0,
    isAuthenticated: false
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);

  useEffect(() => {
    window.electronAPI.getWindowState().then(state => {
      setIsExpanded(state.isExpanded);
    });

    window.electronAPI.onWindowStateChanged((data) => {
      setIsExpanded(data.isExpanded);
    });

    // Check authentication status
    checkAuthStatus();

    // Set up auth state listener
    window.electronAPI.onAuthStateChanged((authData) => {
      setIsAuthenticated(authData.isAuthenticated);
      setUser(authData.user);
      updateSyncStatus();

      if (authData.isAuthenticated && notes.length > 0 && !showMigrationPrompt) {
        // Prompt user to migrate existing data
        setShowMigrationPrompt(true);
      }
    });

    loadNotes();
    loadChatHistory();
    updateSyncStatus();

    // Update sync status periodically
    const syncInterval = setInterval(updateSyncStatus, 10000);
    return () => clearInterval(syncInterval);
  }, []);

  const loadNotes = async () => {
    const loadedNotes = await window.electronAPI.getNotes();
    setNotes(loadedNotes);
  };

  const loadChatHistory = async () => {
    const history = await window.electronAPI.getChatHistory();
    setChatHistory(history);
  };

  const handleToggle = () => {
    window.electronAPI.toggleWindow();
  };

  const handleSaveNote = async (noteText: string, tags: string[] = []) => {
    const newNote: Note = {
      id: Date.now().toString(),
      text: noteText,
      timestamp: Date.now(),
      tags
    };
    const updatedNotes = await window.electronAPI.saveNote(newNote);
    setNotes(updatedNotes);
  };

  const handleDeleteNote = async (noteId: string) => {
    const updatedNotes = await window.electronAPI.deleteNote(noteId);
    setNotes(updatedNotes);
  };

  const handleSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    const updatedHistory = await window.electronAPI.saveChatMessage(userMessage);
    setChatHistory(updatedHistory);

    try {
      const result = await window.electronAPI.sendToClaude(message, notes, chatHistory);

      let assistantMessage: ChatMessage;

      if (result.success && result.content) {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.content,
          timestamp: Date.now()
        };
      } else {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${result.error || 'Unknown error'}. Please check your API key and try again.`,
          timestamp: Date.now()
        };
      }

      const finalHistory = await window.electronAPI.saveChatMessage(assistantMessage);
      setChatHistory(finalHistory);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: Date.now()
      };
      const finalHistory = await window.electronAPI.saveChatMessage(errorMessage);
      setChatHistory(finalHistory);
    }
  };

  const handleClearChat = async () => {
    await window.electronAPI.clearChatHistory();
    setChatHistory([]);
  };

  const handleExport = async (format: 'json' | 'markdown') => {
    const result = await window.electronAPI.exportNotes(format);
    const blob = new Blob([result.content], {
      type: format === 'json' ? 'application/json' : 'text/markdown'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Authentication functions
  const checkAuthStatus = async () => {
    const authenticated = await window.electronAPI.authIsAuthenticated();
    const currentUser = await window.electronAPI.authGetUser();
    setIsAuthenticated(authenticated);
    setUser(currentUser);
  };

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    const result = await window.electronAPI.authSignIn(email, password);
    setAuthLoading(false);
    return result;
  };


  const handleLogout = async () => {
    await window.electronAPI.authSignOut();
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleContinueOffline = async () => {
    console.log('Continue offline clicked');
    await window.electronAPI.continueOffline();
    // Mark as offline mode to bypass authentication
    setIsOfflineMode(true);
    setIsAuthenticated(false);
    setUser(null);
  };

  // Sync functions
  const updateSyncStatus = async () => {
    const status = await window.electronAPI.syncGetStatus();
    setSyncStatus(status);
  };

  const handleForceSync = async () => {
    await window.electronAPI.syncForceSync();
    await updateSyncStatus();
    await loadNotes(); // Refresh notes after sync
  };

  const handleMigrateData = async () => {
    try {
      await window.electronAPI.syncMigrateData();
      setShowMigrationPrompt(false);
      await updateSyncStatus();
    } catch (error) {
      console.error('Migration failed:', error);
    }
  };

  // Show login screen if authentication status is unknown
  if (isAuthenticated === null && !isOfflineMode) {
    return (
      <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Show login screen if not authenticated and not in offline mode
  if (!isAuthenticated && !isOfflineMode) {
    return (
      <div className="w-full h-screen overflow-hidden">
        <LoginScreen
          onLogin={handleLogin}
          onContinueOffline={handleContinueOffline}
          isLoading={authLoading}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <FloatingButton key="button" onClick={handleToggle} />
        ) : (
          <ExpandedView
            key="expanded"
            notes={notes}
            chatHistory={chatHistory}
            onToggle={handleToggle}
            onSaveNote={handleSaveNote}
            onDeleteNote={handleDeleteNote}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onExport={handleExport}
            user={user}
            syncStatus={syncStatus}
            onSync={handleForceSync}
            onLogout={handleLogout}
            showMigrationPrompt={showMigrationPrompt}
            onMigrateData={handleMigrateData}
            onDismissMigration={() => setShowMigrationPrompt(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
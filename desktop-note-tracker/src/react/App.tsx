import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FloatingButton from './components/FloatingButton';
import ExpandedView from './components/ExpandedView';
import { Note, ChatMessage } from './types';

function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    window.electronAPI.getWindowState().then(state => {
      setIsExpanded(state.isExpanded);
    });

    window.electronAPI.onWindowStateChanged((data) => {
      setIsExpanded(data.isExpanded);
    });

    loadNotes();
    loadChatHistory();
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
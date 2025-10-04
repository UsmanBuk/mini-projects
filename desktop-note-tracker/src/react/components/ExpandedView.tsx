import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Trash2, Download, MessageSquare, NotebookPen, ChevronLeft, ChevronRight } from 'lucide-react';
import NotesList from './NotesList';
import ChatView from './ChatView';
import NoteInput from './NoteInput';
import { Note, ChatMessage } from '../types';

interface ExpandedViewProps {
  notes: Note[];
  chatHistory: ChatMessage[];
  onToggle: () => void;
  onSaveNote: (text: string, tags?: string[]) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onSendMessage: (message: string) => Promise<void>;
  onClearChat: () => Promise<void>;
  onExport: (format: 'json' | 'markdown') => Promise<void>;
}

const ExpandedView: React.FC<ExpandedViewProps> = ({
  notes,
  chatHistory,
  onToggle,
  onSaveNote,
  onDeleteNote,
  onSendMessage,
  onClearChat,
  onExport
}) => {
  const [activeView, setActiveView] = useState<'notes' | 'chat'>('notes');
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const now = Date.now();
    const noteDate = note.timestamp;
    let matchesDate = true;

    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      matchesDate = noteDate >= today.getTime();
    } else if (dateFilter === 'week') {
      const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
      matchesDate = noteDate >= weekAgo;
    }

    return matchesSearch && matchesDate;
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 100 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 100 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="w-full h-full glass rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    >
      <div className="drag-region flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3 no-drag">
          <button
            onClick={() => setActiveView('notes')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'notes'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <NotebookPen size={16} />
            <span className="text-sm">Notes</span>
          </button>
          <button
            onClick={() => setActiveView('chat')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'chat'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <MessageSquare size={16} />
            <span className="text-sm">Chat</span>
          </button>
        </div>

        <button
          onClick={onToggle}
          className="no-drag p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/80" />
        </button>
      </div>

      {activeView === 'notes' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <NoteInput onSaveNote={onSaveNote} />

            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 glass-input rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none"
              />

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="glass-input rounded-lg px-3 py-1.5 text-sm text-white outline-none no-drag"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
              </select>

              <button
                onClick={() => onExport('json')}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors no-drag"
                title="Export as JSON"
              >
                <Download className="w-4 h-4 text-white/60" />
              </button>

              <button
                onClick={() => onExport('markdown')}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors no-drag"
                title="Export as Markdown"
              >
                <Download className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <NotesList
              notes={filteredNotes.slice(0, 20)}
              onDeleteNote={onDeleteNote}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className={`transition-all duration-300 ${
            isNotesCollapsed ? 'w-0' : 'w-1/3'
          } border-r border-white/10 flex`}>
            {!isNotesCollapsed && (
              <div className="flex-1 overflow-hidden">
                <div className="p-3 border-b border-white/10">
                  <h3 className="text-sm font-medium text-white/80">Recent Notes</h3>
                </div>
                <NotesList
                  notes={notes.slice(0, 10)}
                  onDeleteNote={onDeleteNote}
                  compact
                />
              </div>
            )}
            <button
              onClick={() => setIsNotesCollapsed(!isNotesCollapsed)}
              className="w-6 flex items-center justify-center hover:bg-white/10 transition-colors no-drag"
            >
              {isNotesCollapsed ? (
                <ChevronRight className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-white/60" />
              )}
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatView
              chatHistory={chatHistory}
              onSendMessage={onSendMessage}
              onClearChat={onClearChat}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ExpandedView;
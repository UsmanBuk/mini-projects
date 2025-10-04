import React from 'react';
import { Trash2, Tag } from 'lucide-react';
import { Note } from '../types';
import { motion } from 'framer-motion';

interface NotesListProps {
  notes: Note[];
  onDeleteNote: (noteId: string) => Promise<void>;
  compact?: boolean;
}

const NotesList: React.FC<NotesListProps> = ({ notes, onDeleteNote, compact = false }) => {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
    }

    if (hours < 24) {
      return `${hours}h ago`;
    }

    if (hours < 48) {
      return 'Yesterday';
    }

    return date.toLocaleDateString();
  };

  if (notes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-white/40 text-sm">No notes yet. Start typing to add one!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {notes.map((note, index) => (
        <motion.div
          key={note.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`glass-light rounded-lg ${compact ? 'p-2' : 'p-3'} group hover:bg-white/10 transition-all`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={`text-white/90 ${compact ? 'text-xs line-clamp-2' : 'text-sm'}`}>
                {note.text}
              </p>
              {!compact && note.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Tag className="w-3 h-3 text-white/40" />
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-white/40 ${compact ? 'text-xs' : 'text-xs'}`}>
                {formatTimestamp(note.timestamp)}
              </span>
              <button
                onClick={() => onDeleteNote(note.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all no-drag"
              >
                <Trash2 className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-red-400`} />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default NotesList;
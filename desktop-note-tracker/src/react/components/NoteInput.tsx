import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface NoteInputProps {
  onSaveNote: (text: string, tags?: string[]) => Promise<void>;
}

const NoteInput: React.FC<NoteInputProps> = ({ onSaveNote }) => {
  const [noteText, setNoteText] = useState('');
  const [tags, setTags] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.electronAPI.onFocusNoteInput(() => {
      inputRef.current?.focus();
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (noteText.trim()) {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await onSaveNote(noteText.trim(), tagArray);
      setNoteText('');
      setTags('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Quick note... (Press Enter to save)"
          className="flex-1 glass-input rounded-lg px-3 py-2 text-white placeholder-white/40 outline-none no-drag"
        />
        <button
          type="submit"
          className="glass-button px-4 py-2 rounded-lg hover:bg-white/20 transition-all no-drag"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags (comma separated, optional)"
        className="w-full glass-input rounded-lg px-3 py-1 text-xs text-white placeholder-white/30 outline-none no-drag"
      />
    </form>
  );
};

export default NoteInput;
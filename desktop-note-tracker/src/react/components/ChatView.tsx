import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Bot, User } from 'lucide-react';
import { ChatMessage } from '../types';
import { motion } from 'framer-motion';

interface ChatViewProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  onClearChat: () => Promise<void>;
}

const ChatView: React.FC<ChatViewProps> = ({ chatHistory, onSendMessage, onClearChat }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      setIsLoading(true);
      const currentMessage = message;
      setMessage('');

      await onSendMessage(currentMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
          <Bot className="w-4 h-4" />
          AI Assistant
        </h3>
        <button
          onClick={onClearChat}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors no-drag"
          title="Clear chat history"
        >
          <Trash2 className="w-3.5 h-3.5 text-white/60" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/40 text-sm text-center">
              Ask me about your notes!<br />
              <span className="text-xs">
                "Summarize today's notes", "What did I write about X?"
              </span>
            </p>
          </div>
        ) : (
          <>
            {chatHistory.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-purple-500/30' : 'bg-blue-500/30'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <div className={`glass-light rounded-lg px-3 py-2 ${
                    msg.role === 'user' ? 'bg-purple-500/20' : ''
                  }`}>
                    <p className="text-sm text-white/90 whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <span className="text-xs text-white/40 mt-1 block">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2 justify-start"
              >
                <div className="flex gap-2 max-w-[85%]">
                  <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="glass-light rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about your notes..."
            disabled={isLoading}
            className="flex-1 glass-input rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none no-drag"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="glass-button px-3 py-2 rounded-lg hover:bg-white/20 transition-all no-drag disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatView;
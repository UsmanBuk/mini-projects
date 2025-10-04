import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

interface FloatingButtonProps {
  onClick: () => void;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ onClick }) => {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="w-full h-full glass-button rounded-full flex items-center justify-center cursor-pointer no-drag relative group"
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-50 blur-lg group-hover:opacity-70 transition-opacity animate-pulse-soft" />

      <MessageSquare className="w-8 h-8 text-white relative z-10" />

      <motion.div
        className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-30"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />
    </motion.button>
  );
};

export default FloatingButton;
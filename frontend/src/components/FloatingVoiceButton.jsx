import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X } from 'lucide-react';
import VoiceExpenseModal from './VoiceExpenseModal';

const FloatingVoiceButton = ({ categories, user, onExpenseAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  return (
    <>
      {/* Floating Voice Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 p-4 text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300"
        style={{ 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))'
        }}
      >
        <div className="relative">
          <Mic className="w-6 h-6" />
          
          {/* Pulse Animation */}
          <motion.div
            className="absolute inset-0 rounded-full bg-purple-400"
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        </div>
      </motion.button>

      {/* Voice Expense Modal */}
      <VoiceExpenseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onExpenseAdded={onExpenseAdded}
        categories={categories}
        user={user}
      />
    </>
  );
};

export default FloatingVoiceButton;

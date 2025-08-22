import React, { useState } from "react";
import { motion } from "framer-motion";
import ChatUI from "./Chat/ChatUI";

// Professional chatbot icon for the floating button
const ChatbotIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/><circle cx="12" cy="12" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/></svg>);

export default function ChatbotWidget({ user }) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Simple function to open the full chat modal
  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);

  return (
    <>
      {/* Floating Button - Clean and elegant */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 p-4 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
        onClick={openChat}
        aria-label="Open AI chat"
      >
        <ChatbotIcon className="h-6 w-6" />
        
        {/* Pulse Animation */}
        <motion.div
          className="absolute inset-0 rounded-full bg-blue-400"
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      </motion.button>

      {/* Full Chat Modal */}
      <ChatUI 
        isOpen={isChatOpen}
        onClose={closeChat}
        user={user}
      />
    </>
  );
}

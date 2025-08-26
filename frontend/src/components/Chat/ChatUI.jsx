import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Professional icons using inline SVGs
const ChatbotIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/><circle cx="12" cy="12" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/></svg>);
const X = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>);
const Send = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4 20-7z" /><path d="M22 2 11 13" /></svg>);
const Clock = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
const Image = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>);
const FileText = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>);
const Plus = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>);
const Menu = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>);
const MoreVertical = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>);
const Edit = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>);
const Trash2 = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>);
const Check = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>);
const XIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>);

const API_URL = "http://localhost:5000/api/chat";

// Professional loading animation
const LoadingDots = () => (
    <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
    </div>
);

// Welcome message component
const WelcomeMessage = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <ChatbotIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Welcome to UpNext AI</h2>
        <p className="max-w-md text-gray-600 leading-relaxed">
            I'm your personal AI assistant, ready to help you with anything. 
            Start typing or upload an image to begin a conversation!
        </p>
    </div>
);

// Chat Session Item Component with Naming
const ChatSessionItem = ({ chat, onLoad, onRename, onDelete, isActive }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [newName, setNewName] = useState(chat.customName || chat.message.substring(0, 30));
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle right-click context menu
    const handleContextMenu = (e) => {
        e.preventDefault();
        setShowMenu(true);
    };

    const handleRename = async () => {
        if (newName.trim() && newName !== chat.customName) {
            try {
                setIsUpdating(true);
                await onRename(chat.sessionId, newName.trim());
                setIsRenaming(false);
                setShowMenu(false);
            } catch (error) {
                console.error('Failed to rename chat:', error);
                alert('Failed to rename chat. Please try again.');
            } finally {
                setIsUpdating(false);
            }
        } else if (newName.trim() === '') {
            alert('Chat name cannot be empty!');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleRename();
        } else if (e.key === 'Escape') {
            setIsRenaming(false);
            setNewName(chat.customName || chat.message.substring(0, 30));
        }
    };

    return (
        <div className="relative group">
            <button
                onClick={() => onLoad(chat)}
                onContextMenu={handleContextMenu}
                className={`w-full text-left p-3 rounded-xl transition-colors text-sm ${
                    isActive ? 'bg-blue-100 border border-blue-200' : 'hover:bg-gray-200'
                }`}
            >
                {isRenaming ? (
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            placeholder="Enter chat name..."
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleRename}
                                disabled={isUpdating}
                                className={`px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1 ${
                                    isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {isUpdating ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-3 w-3" />
                                        <span>Save</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setIsRenaming(false);
                                    setNewName(chat.customName || chat.message.substring(0, 30));
                                }}
                                disabled={isUpdating}
                                className={`px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center gap-1 ${
                                    isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                <XIcon className="h-3 w-3" />
                                <span>Cancel</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="truncate text-gray-700 font-medium">
                        {chat.customName ? (
                            <span className="flex items-center gap-2" title={chat.customName}>
                                <Edit className="h-3 w-3 text-blue-600" />
                                {chat.customName}
                            </span>
                        ) : (
                            <span title={chat.message}>
                                {chat.message.substring(0, 40) + '...'}
                            </span>
                        )}
                    </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>{new Date(chat.createdAt).toLocaleDateString()}</span>
                    <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                        {chat.messageCount} messages
                    </span>
                </div>
            </button>

            {/* 3-dot menu button */}
            <button
                ref={menuRef}
                onClick={() => setShowMenu(!showMenu)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>

            {/* Context Menu */}
            <AnimatePresence>
                {showMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    >
                        <div className="py-1">
                            <button
                                onClick={() => {
                                    setIsRenaming(true);
                                    setShowMenu(false);
                                }}
                                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Rename
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(chat.sessionId);
                                    setShowMenu(false);
                                }}
                                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function ChatUI({ isOpen, onClose, user }) {
    const [messages, setMessages] = useState([
        {
            from: "bot",
            text: "Hey there! 👋 I'm UpNext AI, your personal AI assistant. How can I help you today? 🚀",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pastChats, setPastChats] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const USER_ID = user?.uid || "demo-user";

    // Generate a unique session ID when modal opens
    useEffect(() => {
        if (isOpen) {
            const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            setCurrentSessionId(newSessionId);
            console.log('🆔 New chat session started:', newSessionId);
        }
    }, [isOpen]);

    // Auto-scroll to latest message
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    // Load chat history when modal opens
    useEffect(() => {
        if (isOpen && user?.uid) {
            loadPastChats();
        }
    }, [isOpen, user?.uid]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    }, [isOpen]);

    // Load past chats
    const loadPastChats = async () => {
        if (!user?.uid) return;
        
        try {
            // Fetch all chats for the user
            const response = await fetch(`${API_URL}/history`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: user.uid })
            });
            
            if (response.ok) {
                const allChats = await response.json();
                
                // Group chats by session
                const chatsBySession = {};
                allChats.forEach(chat => {
                    const sessionId = chat.sessionId || 'default';
                    if (!chatsBySession[sessionId]) {
                        chatsBySession[sessionId] = [];
                    }
                    chatsBySession[sessionId].push(chat);
                });
                
                // Convert to array format for display
                const sessionChats = Object.entries(chatsBySession).map(([sessionId, chats]) => ({
                    sessionId,
                    message: chats[0]?.message || 'Session',
                    response: chats[0]?.response || '',
                    createdAt: chats[0]?.createdAt || new Date(),
                    updatedAt: chats[chats.length - 1]?.updatedAt || new Date(),
                    messageCount: chats.length,
                    customName: chats[0]?.customName || '' // Include custom name
                }));
                
                setPastChats(sessionChats || []);
            }
        } catch (error) {
            console.error("Failed to fetch chat history:", error);
            setPastChats([]);
        }
    };

    // Rename chat session
    const handleRenameChat = async (sessionId, newName) => {
        if (!user?.uid) return;
        
        try {
            console.log('🔄 Attempting to rename chat session:', { sessionId, newName, uid: user.uid });
            await api.updateChatSessionName(user.uid, sessionId, newName);
            console.log('✅ Chat session renamed successfully');
            // Show success message
            alert(`Chat renamed to: "${newName}"`);
            // Refresh the chat list
            await loadPastChats();
        } catch (error) {
            console.error('Failed to rename chat session:', error);
            alert(`Failed to rename chat: ${error.message}`);
        }
    };

    // Delete chat session
    const handleDeleteChat = async (sessionId) => {
        if (!user?.uid || !confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
            return;
        }
        
        try {
            // Delete from database
            console.log('🔄 Attempting to delete chat session:', { sessionId, uid: user.uid });
            await api.deleteChatSession(user.uid, sessionId);
            console.log('✅ Chat session deleted from database');
            // Remove from local state
            setPastChats(prev => prev.filter(chat => chat.sessionId !== sessionId));
            
            // If this was the current session, clear the messages
            if (currentSessionId === sessionId) {
                clearChat();
            }
        } catch (error) {
            console.error('Failed to delete chat session:', error);
            alert(`Failed to delete chat: ${error.message}`);
        }
    };

    // Generate a smart name for the chat session based on the first message
    const generateChatName = (message) => {
        if (!message || message.length < 3) return null;
        
        // Remove common greetings and make it more descriptive
        const cleanMessage = message.toLowerCase()
            .replace(/^(hi|hello|hey|good morning|good afternoon|good evening|how are you|what's up|sup)\s*/i, '')
            .replace(/^(can you|could you|please|help me|i need|i want|i would like)\s*/i, '')
            .trim();
        
        if (cleanMessage.length < 3) return null;
        
        // Capitalize first letter and limit length
        const name = cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1);
        
        // If the message is too long, try to extract key words
        if (name.length > 50) {
            const words = name.split(' ').slice(0, 4); // Take first 4 words
            const shortName = words.join(' ');
            return shortName.length > 50 ? shortName.substring(0, 47) + '...' : shortName;
        }
        
        return name;
    };

    // Load a specific past chat
    const loadPastChat = async (chat) => {
        // Extract session ID from the chat or generate a new one
        const sessionId = chat.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setCurrentSessionId(sessionId);
        console.log('🆔 Loading chat session:', sessionId);
        
        try {
            // Load all messages from this session
            const response = await fetch(`${API_URL}/history`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: user?.uid, sessionId: sessionId })
            });
            
            if (response.ok) {
                const sessionChats = await response.json();
                
                // Convert to message format
                const sessionMessages = [];
                sessionChats.forEach(chatMsg => {
                    sessionMessages.push(
                        {
                            from: "user",
                            text: chatMsg.message,
                            timestamp: chatMsg.createdAt ? new Date(chatMsg.createdAt) : new Date()
                        },
                        {
                            from: "bot",
                            text: chatMsg.response,
                            timestamp: chatMsg.updatedAt ? new Date(chatMsg.updatedAt) : new Date()
                        }
                    );
                });
                
                setMessages(sessionMessages);
                setIsSidebarOpen(false);
            } else {
                // Fallback to single message if session loading fails
                setMessages([
                    {
                        from: "user",
                        text: chat.message,
                        timestamp: chat.createdAt ? new Date(chat.createdAt) : new Date()
                    },
                    {
                        from: "bot",
                        text: chat.response,
                        timestamp: chat.updatedAt ? new Date(chat.updatedAt) : new Date()
                    }
                ]);
                setIsSidebarOpen(false);
            }
        } catch (error) {
            console.error('Failed to load session messages:', error);
            // Fallback to single message
            setMessages([
                {
                    from: "user",
                    text: chat.message,
                    timestamp: chat.createdAt ? new Date(chat.createdAt) : new Date()
                },
                {
                    from: "bot",
                    text: chat.response,
                    timestamp: chat.updatedAt ? new Date(chat.updatedAt) : new Date()
                }
            ]);
            setIsSidebarOpen(false);
        }
    };

    // Summarize chat
    const summarizeChat = async () => {
        if (messages.length < 2) {
            const botMessage = {
                from: "bot",
                text: "Please have a longer conversation before asking for a summary.",
                timestamp: new Date()
            };
            setMessages((msgs) => [...msgs, botMessage]);
            return;
        }

        const chatHistoryText = messages.map(m => `${m.from}: ${m.text}`).join("\n");
        const fullPrompt = `Please provide a concise and neutral summary of the following chat history:\n\n${chatHistoryText}`;

        setLoading(true);

        try {
            const payload = {
                prompt: fullPrompt,
                user: { uid: user?.uid || 'anonymous' }
            };
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            const summaryText = result?.response || "Sorry, I couldn't generate a summary at this time.";

            setMessages((msgs) => [
                ...msgs,
                { from: "bot", text: summaryText, timestamp: new Date() }
            ]);

            await loadPastChats();

        } catch (error) {
            console.error('API call failed:', error);
            setMessages((msgs) => [
                ...msgs,
                {
                    from: "bot",
                    text: "⚠️ An error occurred while generating the summary.",
                    timestamp: new Date()
                }
            ]);
        }
        setLoading(false);
    };

    // Send message
    const sendMessage = async () => {
        if (!input.trim() && !file) return;

        const userMessage = { from: "user", text: input, image: file, timestamp: new Date() };
        setMessages((msgs) => [...msgs, userMessage]);

        const currentInput = input;
        const currentFile = file;

        setInput("");
        setFile(null);
        setLoading(true);

        // Auto-generate a better name for the chat session if it's the first message
        if (messages.length === 1) { // Only the welcome message
            const autoName = generateChatName(currentInput);
            if (autoName && user?.uid) {
                try {
                    await api.updateChatSessionName(user.uid, currentSessionId, autoName);
                    // Refresh chat list to show the new name
                    await loadPastChats();
                } catch (error) {
                    console.log('Could not auto-name chat session:', error);
                }
            }
        }

        // Use the actual user prop instead of hardcoded USER_ID
        const payload = {
            prompt: currentInput,
            user: { uid: user?.uid || 'anonymous' },
            sessionId: currentSessionId // Include session ID for chat isolation
        };

        if (currentFile) {
            payload.imageData = {
                mimeType: currentFile.type,
                data: currentFile.dataUrl.split(',')[1]
            };
        }

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const botMessage = {
                from: "bot",
                text: data.response || "Sorry, I couldn't answer that.",
                timestamp: new Date()
            };
            setMessages((msgs) => [...msgs, botMessage]);

            await loadPastChats();

        } catch (error) {
            console.error("API call failed:", error);
            setMessages((msgs) => [
                ...msgs,
                {
                    from: "bot",
                    text: `⚠️ Sorry, I'm having trouble connecting right now. ${error.message}`,
                    timestamp: new Date()
                }
            ]);
        }
        setLoading(false);
    };

    // Handle image upload
    const handleImageUpload = (e) => {
        const uploaded = e.target.files[0];
        if (uploaded) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFile({
                    name: uploaded.name,
                    type: uploaded.type,
                    dataUrl: reader.result,
                });
            };
            reader.readAsDataURL(uploaded);
        }
    };

    // Remove uploaded file
    const removeFile = () => {
        setFile(null);
    };

    // Clear chat
    const clearChat = () => {
        // Generate a new session ID for fresh context
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setCurrentSessionId(newSessionId);
        console.log('🆔 New chat session started (clear chat):', newSessionId);
        
        setMessages([
            {
                from: "bot",
                text: "Hey there! 👋 I'm UpNext AI, your personal AI assistant. How can I help you today? 🚀",
                timestamp: new Date()
            }
        ]);
        setFile(null);
        setInput("");
        setIsSidebarOpen(false);
    };

    // Format time
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format date
    const formatDate = (timestamp) => {
        const today = new Date();
        const messageDate = new Date(timestamp);
        const diffTime = Math.abs(today - messageDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return "Today";
        if (diffDays === 2) return "Yesterday";
        return messageDate.toLocaleDateString();
    };

    // Group messages for better UX
    const groupMessages = () => {
        const groups = [];
        let currentGroup = [];

        messages.forEach((msg, index) => {
            if (index === 0) {
                currentGroup.push(msg);
            } else {
                const prevMsg = messages[index - 1];
                const timeDiff = new Date(msg.timestamp) - new Date(prevMsg.timestamp);
                const isSameSender = msg.from === prevMsg.from;
                const isWithinTimeWindow = timeDiff < 60000;

                const isSameImage = (msg.image && prevMsg.image && msg.image.dataUrl === prevMsg.image.dataUrl) || (!msg.image && !prevMsg.image);

                if (isSameSender && isWithinTimeWindow && isSameImage) {
                    currentGroup.push(msg);
                } else {
                    groups.push([...currentGroup]);
                    currentGroup = [msg];
                }
            }
        });

        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        return groups;
    };

    const messageGroups = groupMessages();

    // Render message group
    const renderMessageGroup = (messageGroup, index) => {
        const firstMessage = messageGroup[0];
        const isUser = firstMessage.from === "user";

        return (
            <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
            >
                <div className="flex flex-col max-w-[75%]">
                    {/* Date separator */}
                    {index === 0 || (messages.length > 1 && formatDate(firstMessage.timestamp) !== formatDate(messages[index - 1]?.timestamp)) ? (
                        <div className="flex justify-center mb-4">
                            <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                                {formatDate(firstMessage.timestamp)}
                            </div>
                        </div>
                    ) : null}

                    {messageGroup.map((msg, msgIndex) => (
                        <motion.div
                            key={msgIndex}
                            initial={{ opacity: 0, x: isUser ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: msgIndex * 0.05 }}
                            className={`mb-2 ${msgIndex === messageGroup.length - 1 ? "mb-0" : ""}`}
                        >
                            <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                                {!isUser && (
                                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 mt-1 shadow-sm">
                                        <ChatbotIcon className="h-4 w-4 text-white" />
                                    </div>
                                )}
                                <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                                    <div
                                        className={`px-4 py-3 rounded-2xl text-sm max-w-full shadow-sm ${
                                            isUser
                                                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md"
                                                : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
                                        }`}
                                    >
                                        <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                                        {msg.image && (
                                            <img
                                                src={msg.image.dataUrl}
                                                alt="Uploaded"
                                                className="mt-3 rounded-lg max-w-full h-auto object-cover shadow-sm"
                                            />
                                        )}
                                    </div>
                                    <div className={`text-xs text-gray-400 mt-1 flex items-center gap-1 ${isUser ? "justify-end" : "justify-start"}`}>
                                        <Clock className="h-3 w-3" />
                                        {formatTime(msg.timestamp)}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        );
    };

    // Handle Enter key
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Auto-resize textarea
    const handleInputChange = (e) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Sidebar */}
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="flex-shrink-0 w-80 bg-gray-50 border-r border-gray-200 flex flex-col"
                            >
                                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                                                    <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                        <ChatbotIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-xl text-gray-800">UpNext AI</span>
                                                                                    {currentSessionId && pastChats.find(chat => chat.sessionId === currentSessionId)?.customName && (
                                                <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                                    <Edit className="h-3 w-3" />
                                                    {pastChats.find(chat => chat.sessionId === currentSessionId)?.customName}
                                                </div>
                                            )}
                                    </div>
                                </div>
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
                                    >
                                        <Menu className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* New Chat Button */}
                                <div className="p-4">
                                    <button
                                        onClick={clearChat}
                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md"
                                    >
                                        <Plus className="h-5 w-5" />
                                        <span>New Chat</span>
                                    </button>
                                </div>

                                {/* Past Chats */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Recent Chat Sessions</h3>
                                    {pastChats.length > 0 ? (
                                        <div className="space-y-2">
                                            {pastChats.map((chat, index) => (
                                                <ChatSessionItem
                                                    key={chat.sessionId || index}
                                                    chat={chat}
                                                    onLoad={loadPastChat}
                                                    onRename={handleRenameChat}
                                                    onDelete={handleDeleteChat}
                                                    isActive={currentSessionId === chat.sessionId}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm text-center py-4">No recent chat sessions</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                            <div className="flex items-center gap-3">
                                {!isSidebarOpen && (
                                    <button
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="p-2 mr-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
                                    >
                                        <Menu className="h-5 w-5" />
                                    </button>
                                )}
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <ChatbotIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">UpNext AI Assistant</h2>
                                    <p className="text-sm text-gray-500">Powered by Google Gemini</p>
                                    {currentSessionId && (
                                        <div className="text-xs text-blue-600 mt-1">
                                            {pastChats.find(chat => chat.sessionId === currentSessionId)?.customName ? (
                                                <span className="font-medium flex items-center gap-1">
                                                    <Edit className="h-3 w-3" />
                                                    {pastChats.find(chat => chat.sessionId === currentSessionId)?.customName}
                                                </span>
                                            ) : (
                                                <span className="font-mono">
                                                    Session: {currentSessionId.substring(0, 8)}...
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            <div className="max-w-4xl mx-auto">
                                {messages.length === 0 ? (
                                    <WelcomeMessage />
                                ) : (
                                    <div className="space-y-2">
                                        {messageGroups.map((group, index) => renderMessageGroup(group, index))}
                                    </div>
                                )}

                                {/* Loading Indicator */}
                                {loading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex justify-start mb-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                <ChatbotIcon className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <LoadingDots />
                                                    <span className="text-sm text-gray-600">Thinking...</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white border-t border-gray-200">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-end gap-3">
                                    {/* Summary Button */}
                                    <button
                                        onClick={summarizeChat}
                                        disabled={loading || messages.length < 2}
                                        className="p-3 bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Summarize conversation"
                                    >
                                        <FileText className="h-5 w-5" />
                                    </button>

                                    {/* Image Upload */}
                                    <label className="cursor-pointer p-3 bg-gray-100 hover:bg-blue-100 rounded-xl transition-colors duration-200">
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                        />
                                        <Image className="h-5 w-5 text-gray-600" />
                                    </label>

                                    {/* Text Input */}
                                    <div className="flex-1 relative">
                                        <textarea
                                            ref={inputRef}
                                            className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-800 placeholder:text-gray-400 transition-all duration-200 resize-none"
                                            rows="1"
                                            value={input}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Ask me anything... (Shift + Enter for new line)"
                                            disabled={loading}
                                            style={{ minHeight: '48px', maxHeight: '120px' }}
                                        />

                                        {/* Send Button */}
                                        {(input.trim() || file) && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={sendMessage}
                                                className="absolute right-3 bottom-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-2 hover:shadow-lg transition-all duration-200"
                                                disabled={loading}
                                            >
                                                <Send className="h-5 w-5 -rotate-45" />
                                            </motion.button>
                                        )}
                                    </div>
                                </div>

                                {/* File Preview */}
                                {file && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl"
                                    >
                                        <img src={file.dataUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                                        <span className="truncate flex-1">📎 {file.name}</span>
                                        <button
                                            onClick={removeFile}
                                            className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

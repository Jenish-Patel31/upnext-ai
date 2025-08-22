import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, CheckCircle, AlertCircle, Loader2, Volume2, VolumeX, Lightbulb, Edit3 } from 'lucide-react';
import * as api from '../services/api.js';
import VoiceExpenseTips from './VoiceExpenseTips';

// 🧠 Smart parser function for expense details
function parseExpense(text, categories = []) {
  text = text.toLowerCase().trim();
  
  let amount = null;
  let category = null;
  let title = '';
  let date = new Date(); // default today

  // 🔹 Extract amount (various formats)
  const amountPatterns = [
    /(\d+(?:\.\d{1,2})?)\s*(?:rupees?|rs|₹|dollars?|\$)/i,
    /(?:rupees?|rs|₹|dollars?|\$)\s*(\d+(?:\.\d{1,2})?)/i,
    /(\d+(?:\.\d{1,2})?)/,
    /(\d+)\s*(?:hundred|thousand|k|lakh|lac)/i
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      let extractedAmount = parseFloat(match[1]);
      
      // Handle words like "hundred", "thousand", "lakh"
      if (text.includes('hundred')) extractedAmount *= 100;
      if (text.includes('thousand') || text.includes('k')) extractedAmount *= 1000;
      if (text.includes('lakh') || text.includes('lac')) extractedAmount *= 100000;
      
      amount = extractedAmount;
      break;
    }
  }

  // 🔹 Extract date keywords and patterns
  const datePatterns = {
    'yesterday': () => { const d = new Date(); d.setDate(d.getDate() - 1); return d; },
    'day before yesterday': () => { const d = new Date(); d.setDate(d.getDate() - 2); return d; },
    'tomorrow': () => { const d = new Date(); d.setDate(d.getDate() + 1); return d; },
    'today': () => new Date(),
    'this week': () => { const d = new Date(); d.setDate(d.getDate() - 7); return d; },
    'last week': () => { const d = new Date(); d.setDate(d.getDate() - 14); return d; }
  };

  for (const [keyword, dateFn] of Object.entries(datePatterns)) {
    if (text.includes(keyword)) {
      date = dateFn();
      break;
    }
  }

  // 🔹 Extract category (smart matching with existing categories first)
  // First try to match with existing categories (case-insensitive)
  for (const existingCategory of categories) {
    if (text.includes(existingCategory.name.toLowerCase())) {
      category = existingCategory.name; // Use exact name from database
      break;
    }
  }

  // If no exact match, try keyword matching for common categories
  if (!category) {
    const categoryKeywords = {
      'Food': ['food', 'meal', 'lunch', 'dinner', 'breakfast', 'snack', 'restaurant', 'cafe', 'pizza', 'burger', 'coffee'],
      'Transport': ['transport', 'uber', 'ola', 'taxi', 'bus', 'metro', 'fuel', 'petrol', 'diesel', 'ride', 'travel'],
      'Shopping': ['shopping', 'clothes', 'shirt', 'pants', 'dress', 'shoes', 'mall', 'store', 'buy', 'purchase'],
      'Entertainment': ['movie', 'cinema', 'theatre', 'concert', 'show', 'game', 'entertainment', 'fun', 'party'],
      'Health': ['medicine', 'doctor', 'hospital', 'pharmacy', 'health', 'medical', 'checkup', 'treatment'],
      'Education': ['book', 'course', 'training', 'education', 'school', 'college', 'university', 'study', 'learn'],
      'Bills': ['bill', 'electricity', 'water', 'gas', 'internet', 'phone', 'utility', 'payment'],
      'Groceries': ['grocery', 'vegetables', 'fruits', 'milk', 'bread', 'supermarket', 'market', 'produce']
    };

    for (const [catName, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        category = catName;
        break;
      }
    }
  }

  // 🔹 Extract title (remove amount, category, and date words)
  title = text
    .replace(amount ? amount.toString() : '', '')
    .replace(/\b(rupees?|rs|₹|dollars?|\$|hundred|thousand|k|lakh|lac)\b/gi, '')
    .replace(/\b(yesterday|today|tomorrow|day before yesterday|this week|last week)\b/gi, '')
    .replace(/\b(add|spent|spend|log|for|on|expense|cost)\b/gi, '')
    .trim();

  // Clean up title
  title = title.replace(/\s+/g, ' ').trim();
  
  // If title is empty, use category as title
  if (!title && category) {
    title = category;
  }

  // Default values
  if (!category) category = 'Other';
  if (!title) title = 'Voice Expense';

  return { amount, category, title, date };
}

const VoiceExpenseModal = ({ isOpen, onClose, onExpenseAdded, categories, user }) => {
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [recognition, setRecognition] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [parsedExpense, setParsedExpense] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Debug logging for state changes
  useEffect(() => {
    console.log('State changed:', { showEditForm, showConfirmation, editingExpense });
  }, [showEditForm, showConfirmation, editingExpense]);
  const [showTips, setShowTips] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      addMessage('system', 'Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Initialize recognition
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-IN'; // Indian English
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setListening(true);
      addMessage('system', '🎤 Listening... Speak clearly about your expense.');
    };

    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      // Update the last message if it's interim
      if (event.results[event.results.length - 1].isFinal) {
        addMessage('user', transcript);
        handleExpenseFromSpeech(transcript);
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
      
      if (event.error === 'no-speech') {
        addMessage('system', 'No speech detected. Please try again.');
      } else if (event.error === 'audio-capture') {
        addMessage('system', 'Microphone access denied. Please allow microphone access.');
      } else {
        addMessage('system', `Error: ${event.error}. Please try again.`);
      }
    };

    rec.onend = () => {
      setListening(false);
    };

    setRecognition(rec);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { 
      sender, 
      text, 
      timestamp: new Date(),
      id: Date.now() + Math.random()
    }]);
  };

  const startListening = () => {
    if (!recognition) return;
    
    try {
      recognition.start();
      addMessage('system', '🎤 Starting voice recognition...');
    } catch (error) {
      console.error('Error starting recognition:', error);
      addMessage('system', 'Error starting voice recognition. Please try again.');
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  const handleExpenseFromSpeech = async (text) => {
    setLoading(true);
    
    try {
      const parsed = parseExpense(text, categories);
      setParsedExpense(parsed);

      if (!parsed.amount) {
        addMessage('system', '❌ Could not detect the expense amount. Please try saying something like "I spent 500 rupees on food" or "500 for lunch".');
        setLoading(false);
        return;
      }

      if (!parsed.category) {
        addMessage('system', '❌ Could not detect the expense category. Please try being more specific about what you spent money on.');
        setLoading(false);
        return;
      }

      // Check if category exists, if not create it
      let categoryExists = categories.find(cat => cat.name.toLowerCase() === parsed.category.toLowerCase());
      
      if (!categoryExists) {
        addMessage('system', `🆕 Creating new category: ${parsed.category}`);
        
        try {
          const newCategory = await api.addCategory({
            uid: user.uid,
            name: parsed.category,
            color: '#3B82F6',
            budgetLimit: 0,
            icon: '💼'
          });
          
          // Update the categories list
          categories.push(newCategory.category);
          categoryExists = newCategory.category;
          
          addMessage('system', `✅ Category "${parsed.category}" created successfully!`);
        } catch (error) {
          console.error('Error creating category:', error);
          addMessage('system', `❌ Failed to create category "${parsed.category}". Please try adding it manually first.`);
          setLoading(false);
          return;
        }
      }

      // Show confirmation with enhanced details
      setShowConfirmation(true);
      
      // Enhanced confirmation message with emojis and formatting
      const categoryEmoji = getCategoryEmoji(parsed.category);
      const amountFormatted = formatAmount(parsed.amount);
      
      addMessage('system', `✅ Perfect! I understood your expense:\n\n${categoryEmoji} **${parsed.title}**\n💰 **Amount:** ${amountFormatted}\n🏷️ **Category:** ${parsed.category}\n📅 **Date:** ${parsed.date.toLocaleDateString('en-IN')}\n\nIs this correct?`);

    } catch (error) {
      console.error('Error parsing expense:', error);
      addMessage('system', '❌ Sorry, I had trouble understanding. Please try again with clearer speech.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get category emoji
  const getCategoryEmoji = (category) => {
    const emojiMap = {
      'Food': '🍕',
      'Transport': '🚗',
      'Shopping': '🛍️',
      'Entertainment': '🎬',
      'Health': '🏥',
      'Education': '📚',
      'Bills': '📄',
      'Groceries': '🛒',
      'Other': '💼'
    };
    return emojiMap[category] || '💼';
  };

  // Helper function to format amount with Indian numbering system
  const formatAmount = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} lakh`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    } else {
      return `₹${amount.toFixed(2)}`;
    }
  };

  const confirmAndSaveExpense = async () => {
    if (!parsedExpense) return;

    setLoading(true);
    addMessage('system', '💾 Saving your expense...');

    try {
      const newExpense = await api.addExpense({
        uid: user.uid,
        title: parsedExpense.title,
        amount: parsedExpense.amount,
        category: parsedExpense.category,
        date: parsedExpense.date.toISOString().split('T')[0]
      });

      onExpenseAdded(newExpense.expense);
      
      const categoryEmoji = getCategoryEmoji(parsedExpense.category);
      const amountFormatted = formatAmount(parsedExpense.amount);
      
      addMessage('system', `🎉 **Expense Added Successfully!**\n\n${categoryEmoji} **${parsedExpense.title}**\n💰 **Amount:** ${amountFormatted}\n🏷️ **Category:** ${parsedExpense.category}\n📅 **Date:** ${parsedExpense.date.toLocaleDateString('en-IN')}\n\nYour expense has been saved to your tracker!`);
      
      // Reset and close after a delay
      setTimeout(() => {
        setParsedExpense(null);
        setShowConfirmation(false);
        setMessages([]);
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Error saving expense:', error);
      addMessage('system', '❌ Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const retryRecognition = () => {
    setParsedExpense(null);
    setShowConfirmation(false);
    setShowEditForm(false);
    setEditingExpense(null);
    setMessages([]);
    startListening();
  };

  const startEditing = () => {
    console.log('Edit button clicked!', { parsedExpense });
    setEditingExpense({
      title: parsedExpense.title,
      amount: parsedExpense.amount,
      category: parsedExpense.category,
      date: parsedExpense.date
    });
    setShowEditForm(true);
    console.log('Edit form should now be visible');
  };

  const handleEditChange = (field, value) => {
    setEditingExpense(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveEdit = () => {
    setParsedExpense(editingExpense);
    setShowEditForm(false);
    setEditingExpense(null);
  };

  const cancelEdit = () => {
    setShowEditForm(false);
    setEditingExpense(null);
  };

  const closeModal = () => {
    if (recognition) {
      recognition.stop();
    }
    setListening(false);
    setLoading(false);
    setMessages([]);
    setParsedExpense(null);
    setShowConfirmation(false);
    setShowEditForm(false);
    setEditingExpense(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={closeModal}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Voice Expense Assistant</h2>
                  <p className="text-blue-100 text-sm">Speak naturally to add expenses</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowTips(true)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="View Tips"
                >
                  <Lightbulb className="w-5 h-5" />
                </button>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Mic className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Click the microphone and speak about your expense</p>
                <p className="text-xs mt-2">Example: "I spent 500 rupees on lunch today"</p>
              </div>
            )}

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : msg.sender === 'system'
                      ? 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                      : 'bg-gray-200 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
            
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white border border-gray-200 rounded-2xl p-3 rounded-bl-md">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">Processing...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="p-4 border-t bg-white">
            {!isSupported ? (
              <div className="text-center text-red-600 text-sm">
                Speech recognition not supported in this browser
              </div>
            ) : showEditForm ? (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-blue-800 mb-3">
                    <Edit3 className="w-5 h-5" />
                    <span className="font-medium text-lg">Edit Expense</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Title</label>
                      <input
                        type="text"
                        value={editingExpense?.title || ''}
                        onChange={(e) => handleEditChange('title', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Expense title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Amount</label>
                      <input
                        type="number"
                        value={editingExpense?.amount || ''}
                        onChange={(e) => handleEditChange('amount', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Category</label>
                      <select
                        value={editingExpense?.category || ''}
                        onChange={(e) => handleEditChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent"
                      >
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Date</label>
                      <input
                        type="date"
                        value={editingExpense?.date ? editingExpense.date.toISOString().split('T')[0] : ''}
                        onChange={(e) => handleEditChange('date', e.target.value ? new Date(e.target.value) : new Date())}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={cancelEdit}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : showConfirmation ? (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-blue-800 mb-3">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium text-lg">Confirm Expense</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoryEmoji(parsedExpense?.category)}</span>
                      <div>
                        <p className="font-semibold text-blue-900">{parsedExpense?.title}</p>
                        <p className="text-sm text-blue-600">Expense Title</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">💰</span>
                      <div>
                        <p className="font-semibold text-blue-900">{formatAmount(parsedExpense?.amount)}</p>
                        <p className="text-sm text-blue-600">Amount</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🏷️</span>
                      <div>
                        <p className="font-semibold text-blue-900">{parsedExpense?.category}</p>
                        <p className="text-sm text-blue-600">Category</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📅</span>
                      <div>
                        <p className="font-semibold text-blue-900">{parsedExpense?.date?.toLocaleDateString('en-IN')}</p>
                        <p className="text-sm text-blue-600">Date</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={retryRecognition}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={startEditing}
                    className="p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="Edit expense details"
                  >
                    <Edit3 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={confirmAndSaveExpense}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Confirm & Save'}
                  </button>
                </div>
              </div>

            ) : (
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={listening ? stopListening : startListening}
                  disabled={loading}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all duration-200 ${
                    listening 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {listening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </motion.button>
              </div>
            )}

            {/* Help Text */}
            <div className="mt-4 text-center text-xs text-gray-500">
              {!showConfirmation && (
                <p>Try saying: "I spent 500 rupees on lunch" or "500 for food today"</p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Tips Modal */}
      <VoiceExpenseTips 
        isVisible={showTips} 
        onClose={() => setShowTips(false)} 
      />
    </AnimatePresence>
  );
};

export default VoiceExpenseModal;

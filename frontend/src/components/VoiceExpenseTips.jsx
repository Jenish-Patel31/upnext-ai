import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Mic, CheckCircle, AlertCircle, Globe } from 'lucide-react';

const VoiceExpenseTips = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  const tips = [
    {
      icon: <Mic className="w-5 h-5 text-blue-600" />,
      title: "Speak in Any Language",
      description: "Use English, Gujarati, Marathi, Hindi, Bengali, Tamil, Telugu, Kannada, or Malayalam"
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      title: "Natural Language",
      description: "Speak naturally like you're talking to a friend about your expenses"
    },
    {
      icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
      title: "Include Amount",
      description: "Always mention the amount clearly: '500', '1.5k', '2 lakh' or '1000 rupees'"
    },
    {
      icon: <Globe className="w-5 h-5 text-purple-600" />,
      title: "AI-Powered",
      description: "Advanced AI automatically detects your language and understands natural speech"
    }
  ];

  const examples = [
    // English
    "I spent 500 rupees on lunch today",
    "500 for food yesterday",
    "2 thousand on shopping",
    "1.5k for Uber ride",
    // Gujarati
    "મેં આજે લંચ પર 500 રૂપિયા ખર્ચ્યા",
    "ગઈકાલે ખોરાક માટે 500",
    // Marathi
    "मी आज दुपारच्या जेवणावर 500 रुपये खर्च केले",
    "काल अन्नासाठी 500",
    // Hindi
    "मैंने आज लंच पर 500 रुपये खर्च किए",
    "कल खाने के लिए 500"
  ];

  const supportedLanguages = [
    { name: 'English', flag: '🇺🇸', examples: ['I spent 500 on lunch', '500 for food today'] },
    { name: 'Gujarati', flag: '🇮🇳', examples: ['મેં 500 ખર્ચ્યા', '500 ખોરાક માટે'] },
    { name: 'Marathi', flag: '🇮🇳', examples: ['मी 500 खर्च केले', '500 अन्नासाठी'] },
    { name: 'Hindi', flag: '🇮🇳', examples: ['मैंने 500 खर्च किए', '500 खाने के लिए'] },
    { name: 'Bengali', flag: '🇮🇳', examples: ['আমি ৫০০ খরচ করেছি', '৫০০ খাবারের জন্য'] },
    { name: 'Tamil', flag: '🇮🇳', examples: ['நான் 500 செலவு செய்தேன்', '500 உணவுக்காக'] },
    { name: 'Telugu', flag: '🇮🇳', examples: ['నేను 500 ఖర్చు చేశాను', '500 ఆహారం కోసం'] },
    { name: 'Kannada', flag: '🇮🇳', examples: ['ನಾನು 500 ಖರ್ಚು ಮಾಡಿದ್ದೇನೆ', '500 ಆಹಾರಕ್ಕಾಗಿ'] },
    { name: 'Malayalam', flag: '🇮🇳', examples: ['ഞാൻ 500 ചെലവഴിച്ചു', '500 ഭക്ഷണത്തിനായി'] }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Voice Expense Tips</h2>
              <p className="text-blue-100 text-sm">Learn how to use voice commands in any language</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Tips */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Best Practices</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex-shrink-0 mt-1">
                    {tip.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{tip.title}</h4>
                    <p className="text-sm text-gray-600">{tip.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Language Support */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🌍 Supported Languages</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {supportedLanguages.map((lang, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4"
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <h4 className="font-semibold text-blue-900">{lang.name}</h4>
                  </div>
                  <div className="space-y-2">
                    {lang.examples.map((example, idx) => (
                      <div key={idx} className="text-sm bg-white rounded-lg p-2 border border-blue-100">
                        "{example}"
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Examples */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Example Phrases</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examples.map((example, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800"
                >
                  "{example}"
                </motion.div>
              ))}
            </div>
          </div>

          {/* Amount Formats */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Amount Formats</h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900">Numbers</p>
                  <p className="text-gray-600">500, 1000, 2500</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">With Currency</p>
                  <p className="text-gray-600">500 rupees, ₹1000</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Abbreviations</p>
                  <p className="text-gray-600">1.5k, 2k, 5k</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Indian Units</p>
                  <p className="text-gray-600">2 lakh, 5 lac</p>
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏷️ Common Categories</h3>
            <div className="flex flex-wrap gap-2">
              {['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Bills', 'Groceries'].map((category, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-3 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                >
                  {category}
                </motion.span>
              ))}
            </div>
          </div>

          {/* AI Features */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-3">🤖 AI-Powered Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-green-800">🌍 Auto Language Detection</p>
                <p className="text-green-700">Automatically detects your spoken language</p>
              </div>
              <div>
                <p className="font-medium text-green-800">🧠 Smart Parsing</p>
                <p className="text-green-700">Understands natural speech patterns</p>
              </div>
              <div>
                <p className="font-medium text-green-800">🔤 Multi-language Support</p>
                <p className="text-green-700">Works with 9 Indian languages</p>
              </div>
              <div>
                <p className="font-medium text-green-800">💡 Context Understanding</p>
                <p className="text-green-700">Gets the meaning, not just words</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Got it! Let me try
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VoiceExpenseTips;

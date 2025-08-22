import React from "react";
import { motion } from "framer-motion";
import { 
  SparklesIcon, 
  ChatBubbleLeftRightIcon, 
  LightBulbIcon, 
  CodeBracketIcon,
  AcademicCapIcon,
  HeartIcon
} from "@heroicons/react/24/outline";

const WelcomeMessage = () => {
  const features = [
    {
      icon: <CodeBracketIcon className="h-6 w-6" />,
      title: "Code Assistance",
      description: "Get help with programming, debugging, and code reviews"
    },
    {
      icon: <LightBulbIcon className="h-6 w-6" />,
      title: "Creative Writing",
      description: "Generate content, brainstorm ideas, and improve your writing"
    },
    {
      icon: <AcademicCapIcon className="h-6 w-6" />,
      title: "Learning Support",
      description: "Learn new concepts, get explanations, and study help"
    },
    {
      icon: <HeartIcon className="h-6 w-6" />,
      title: "Personal Assistant",
      description: "Daily tasks, planning, and productivity tips"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center h-full text-center px-6"
    >
      {/* Main Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-8 shadow-2xl"
      >
        <SparklesIcon className="h-12 w-12 text-white" />
      </motion.div>

      {/* Welcome Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-3">
          Welcome to UpNext AI! 🤖
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
          I'm your personal AI assistant, ready to help you with coding, writing, learning, 
          and so much more. Let's make something amazing together!
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full mb-8"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-purple-300 group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors duration-300">
                <div className="text-indigo-600 group-hover:text-purple-600 transition-colors duration-300">
                  {feature.icon}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Start Suggestions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100"
      >
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-600" />
          Try asking me about:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600">• "Help me debug this React component"</div>
          <div className="text-gray-600">• "Write a blog post about AI trends"</div>
          <div className="text-gray-600">• "Explain machine learning concepts"</div>
          <div className="text-gray-600">• "Create a workout plan for beginners"</div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeMessage; 
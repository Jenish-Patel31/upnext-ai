//chatController.js
import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';
import User from '../models/userModel.js';
import Chat from '../models/chatModel.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export const handleChat = async (req, res) => {
  try {
    const { prompt, user, imageData } = req.body;
    
    // Validate required fields
    if (!prompt || !user?.uid) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['prompt', 'user.uid'],
        received: { prompt: !!prompt, user: !!user, uid: user?.uid }
      });
    }

    let personalizedPrompt = prompt;

    // 🔍 Fetch user memory (goals & past messages)
    const userData = await User.findOne({ uid: user.uid });

    if (userData) {
      if (userData.goals?.length) {
        personalizedPrompt += `\nUser goals: ${userData.goals.join(', ')}.`;
      }

      if (userData.pastMessages?.length) {
        const recentMessages = userData.pastMessages.slice(-3).join('\n');
        personalizedPrompt += `\nPast messages:\n${recentMessages}`;
      }
    }
    
    // --- CORRECTED LOGIC FOR MULTIMODAL PROMPT ---
    const parts = [];

    // Add text part only if prompt is not empty
    if (personalizedPrompt && personalizedPrompt.trim() !== '') {
      parts.push({ text: personalizedPrompt });
    }

    // Add image data part only if it exists, and clean up the Base64 string
    if (imageData && imageData.data) {
        const cleanedData = imageData.data.startsWith('data:') 
          ? imageData.data.split(',')[1] 
          : imageData.data;
      parts.push({ 
        inlineData: {
          ...imageData,
          data: cleanedData 
        }
      });
    }
    
    // Defensive check to ensure the parts array is not empty
    if (parts.length === 0) {
      return res.status(400).json({ error: 'No content provided in the prompt.' });
    }

    // 🧠 Gemini generates response
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: parts
        }
      ]
    });

    const response = await result.response;
    const text = response.text();

    // 💾 Save the chat to the database after a successful response
    if (user?.uid) {
        const newChat = new Chat({
            uid: user.uid,
            message: prompt, 
            response: text
        });
        await newChat.save();
    }
    
    // This section is for a different purpose but is kept for consistency.
    if (userData) {
      userData.pastMessages.push(prompt);
      if (userData.pastMessages.length > 20) userData.pastMessages.shift();
      await userData.save();
    }

    res.json({ response: text });
  } catch (error) {
    // Handle specific Gemini API errors
    if (error.message?.includes('API key')) {
      return res.status(500).json({ error: 'Invalid Gemini API key. Please check your configuration.' });
    }
    
    if (error.message?.includes('quota')) {
      return res.status(429).json({ error: 'Gemini API quota exceeded. Please try again later.' });
    }

    res.status(500).json({ 
      error: 'Gemini API request failed.',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const saveChat = async (req, res) => {
  try {
    const { uid, message, response } = req.body;

    // Validate required fields
    if (!uid || !message || !response) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['uid', 'message', 'response'],
        received: { uid, message: !!message, response: !!response }
      });
    }

    const newChat = new Chat({
      uid,
      message: message.trim(),
      response: response.trim()
    });

    const savedChat = await newChat.save();
    
    res.status(201).json({
      message: "Chat saved successfully",
      chat: savedChat
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      error: 'Failed to save chat',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { uid } = req.body; 
    
    if (!uid) {
      return res.status(400).json({ error: 'User ID is required to fetch chat history.' });
    }
    
    // We are now fetching the chats from the `Chat` model
    const chats = await Chat.find({ uid }).sort({ createdAt: -1 });
    
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch chat history',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getChatsByUser = async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const chats = await Chat.find({ uid }).sort({ createdAt: -1 });
    
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch chats',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};





//old code: -------------------------------------------------------------------------------










// export const saveChat = async (req, res) => {
//   try {
//     const { uid, message, response } = req.body;

//     const newChat = new Chat({
//       uid,
//       message,
//       response
//     });

//     const savedChat = await newChat.save();
//     res.status(201).json({
//       message: "Chat saved",
//       chat: savedChat
//     });
//   } catch (error) {
//     console.error('Error saving chat:', error);
//     res.status(500).json({ error: 'Failed to save chat' });
//   }
// };

// export const getChatsByUser = async (req, res) => {
//   try {
//     const { uid } = req.params;
//     const chats = await Chat.find({ uid }).sort({ timestamp: -1 });
//     res.status(200).json(chats);
//   } catch (error) {
//     console.error('Error fetching chats:', error);
//     res.status(500).json({ error: 'Failed to fetch chats' });
//   }
// };





// export const handleChat = async (req, res) => {
//   try {
//     const { prompt, user } = req.body; // Accept prompt and user data
//     let personalizedPrompt = prompt;

//     // 🔍 Fetch user memory (goals & past messages)
//     const userData = await User.findOne({ uid: user.uid });

//     if (userData) {
//       if (userData.goals?.length) {
//         personalizedPrompt += `\nUser goals: ${userData.goals.join(', ')}.`;
//       }

//       if (userData.pastMessages?.length) {
//         const recentMessages = userData.pastMessages.slice(-3).join('\n');
//         personalizedPrompt += `\nPast messages:\n${recentMessages}`;
//       }
//     }

//     // 🧠 Gemini generates response
//     const result = await model.generateContent(personalizedPrompt);
//     const response = await result.response;
//     const text = response.text();


//     // 💾 Save latest prompt to memory
//     if (userData) {
//       userData.pastMessages.push(prompt);
//       if (userData.pastMessages.length > 20) userData.pastMessages.shift(); // Limit history
//       await userData.save();
//     }

//     res.json({ response: text });
//   } catch (error) {
//     console.error('Gemini Error:', error);
//     res.status(500).json({ error: 'Gemini API request failed.' });
//   }
// };




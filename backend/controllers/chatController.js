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
    const { prompt, user, imageData, sessionId } = req.body;
    
    // Validate required fields
    if (!prompt || !user?.uid) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['prompt', 'user.uid'],
        received: { prompt: !!prompt, user: !!user, uid: user?.uid }
      });
    }

    // 🔍 Fetch user memory (goals & past messages)
    const userData = await User.findOne({ uid: user.uid });

    // 🧠 Create a comprehensive system prompt for better AI responses
    const systemPrompt = `You are UpNext AI, a highly intelligent and helpful personal AI assistant specializing in financial advice, productivity, and general assistance. 

      IMPORTANT RULES:
    1. Always provide helpful, actionable, and specific advice
    2. Never give generic or vague responses
    3. If asked about investments, provide detailed, practical advice
    4. If asked about financial planning, give step-by-step guidance
    5. Be conversational but professional
    6. Ask follow-up questions when appropriate
    7. Provide examples and specific recommendations
    8. If you don't know something, say so and suggest alternatives

    Your expertise includes:
    - Financial planning and investment advice
    - Personal productivity and goal setting
    - General knowledge and problem-solving
    - Business and career guidance
    - Health and wellness tips

    Current user context: ${userData ? `User has goals: ${userData.goals?.join(', ') || 'None set'}` : 'New user'}

    User's message: "${prompt}"

    Please provide a helpful, specific, and actionable response:`;

    // 🔍 Fetch chat context ONLY from the current session (if sessionId provided)
    let chatContext = '';
    if (user?.uid && sessionId) {
      // Only get messages from the current session
      const sessionChats = await Chat.find({ 
        uid: user.uid, 
        sessionId: sessionId 
      }).sort({ createdAt: 1 }); // Chronological order for context
      
      if (sessionChats.length > 0) {
        chatContext = '\n\nCurrent conversation context:\n' + 
          sessionChats.map(chat => 
            `User: ${chat.message}\nAI: ${chat.response}`
          ).join('\n\n');
      }
    }

    // 🎯 Create the final prompt with context (only current session)
    const finalPrompt = systemPrompt + chatContext;

    // 🚀 Enhanced Gemini API call with better configuration
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: finalPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7, // Balanced creativity and consistency
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1500, // Allow longer, more detailed responses
      }
    });

    const response = await result.response;
    const text = response.text();

    // 💾 Save the chat to the database WITH session ID
    if (user?.uid) {
      const newChat = new Chat({
        uid: user.uid,
        message: prompt, 
        response: text,
        sessionId: sessionId || 'default' // Include session ID
      });
      await newChat.save();
    }
    
    // 💾 Update user's past messages for context
    if (userData) {
      userData.pastMessages.push(prompt);
      if (userData.pastMessages.length > 20) userData.pastMessages.shift();
      await userData.save();
    }

    res.json({ response: text });
  } catch (error) {
    console.error('Chat Error:', error);
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API key')) {
      return res.status(500).json({ error: 'Invalid Gemini API key. Please check your configuration.' });
    }
    
    if (error.message?.includes('quota')) {
      return res.status(429).json({ error: 'Gemini API quota exceeded. Please try again later.' });
    }

    res.status(500).json({ 
      error: 'Chat request failed. Please try again.',
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
    const { uid, sessionId } = req.body; 
    
    if (!uid) {
      return res.status(400).json({ error: 'User ID is required to fetch chat history.' });
    }
    
    // If sessionId is provided, fetch only that session's chats
    // If no sessionId, fetch all chats (for backward compatibility)
    const query = { uid };
    if (sessionId) {
      query.sessionId = sessionId;
    }
    
    const chats = await Chat.find(query).sort({ createdAt: -1 });
    
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

export const updateChatSessionName = async (req, res) => {
  try {
    console.log('🔄 Update chat session name request:', req.body);
    const { uid, sessionId, customName } = req.body;
    
    if (!uid || !sessionId || !customName) {
      console.log('❌ Missing required fields:', { uid, sessionId, customName });
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['uid', 'sessionId', 'customName'],
        received: { uid, sessionId, customName }
      });
    }

    console.log('🔍 Updating chats for session:', { uid, sessionId, customName });

    // Update all chats in the session with the new custom name
    const updateResult = await Chat.updateMany(
      { uid, sessionId },
      { customName: customName.trim() }
    );

    console.log('📊 Update result:', updateResult);

    if (updateResult.modifiedCount === 0) {
      console.log('⚠️ No chats found to update for session:', sessionId);
      return res.status(404).json({ 
        error: 'No chat session found to update',
        sessionId 
      });
    }

    console.log('✅ Successfully updated chat session name');
    res.status(200).json({
      message: "Chat session name updated successfully",
      sessionId,
      customName: customName.trim(),
      updatedCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error updating chat session name:', error);
    res.status(500).json({ 
      error: 'Failed to update chat session name',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const deleteChatSession = async (req, res) => {
  try {
    console.log('🔄 Delete chat session request:', req.body);
    const { uid, sessionId } = req.body;
    
    if (!uid || !sessionId) {
      console.log('❌ Missing required fields:', { uid, sessionId });
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['uid', 'sessionId'],
        received: { uid, sessionId }
      });
    }

    console.log('🔍 Deleting chats for session:', { uid, sessionId });

    // Delete all chats in the session
    const deleteResult = await Chat.deleteMany({ 
      uid, 
      sessionId 
    });

    console.log('📊 Delete result:', deleteResult);

    if (deleteResult.deletedCount === 0) {
      console.log('⚠️ No chats found to delete for session:', sessionId);
      return res.status(404).json({ 
        error: 'No chat session found to delete',
        sessionId 
      });
    }

    console.log('✅ Successfully deleted chat session');
    res.status(200).json({
      message: "Chat session deleted successfully",
      sessionId,
      deletedCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('❌ Error deleting chat session:', error);
    res.status(500).json({ 
      error: 'Failed to delete chat session',
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




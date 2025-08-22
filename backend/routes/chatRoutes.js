//chatRoutes.js
import express from 'express';
import { handleChat, saveChat, getChatsByUser, getChatHistory } from '../controllers/chatController.js';
import { verifyToken } from '../utils/authMiddleware.js';

const router = express.Router();

// Main chat endpoint - temporarily without auth for demo
router.post('/', handleChat);

// Chat history endpoint

router.post('/history', getChatHistory);


// Save chat endpoint
router.post('/save', saveChat);

// Get chats by user (with auth)
router.get('/:uid', verifyToken, getChatsByUser);

export default router;

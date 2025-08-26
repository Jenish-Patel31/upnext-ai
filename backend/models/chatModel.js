//chatModel.js

import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    uid: String, // Firebase UID
    message: String,
    response: String,
    sessionId: {
        type: String,
        default: 'default' // Default session for backward compatibility
    },
    customName: {
        type: String,
        default: '' // Custom name for the chat session
    }
}, { timestamps: true });

export default mongoose.model('Chat', chatSchema); 
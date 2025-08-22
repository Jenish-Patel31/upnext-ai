//chatModel.js

import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    uid: String, // Firebase UID
    message: String,
    response: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('Chat', chatSchema); 
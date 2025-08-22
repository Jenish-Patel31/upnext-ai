//userModel.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    uid: String, // Firebase UID
    name: String,
    email: String,
    goals: {
        type: [String],
        default: []
    },
    preferences: {
        riskProfile: String,
        budget: Number,
    },
    pastMessages: { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.model('User', userSchema);

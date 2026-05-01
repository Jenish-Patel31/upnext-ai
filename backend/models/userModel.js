//userModel.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    uid: String, // Firebase UID
    name: String,
    email: String,
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    bio: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    occupation: { type: String, default: '' },
    company: { type: String, default: '' },
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

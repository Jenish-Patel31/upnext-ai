import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
    uid: String, // Firebase UID
    goal: String,
    steps: [String],
    completed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export default mongoose.model('Plan', planSchema); 
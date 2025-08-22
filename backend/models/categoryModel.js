import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    uid: String, // Firebase UID
    name: String,
    color: {
        type: String,
        default: '#3B82F6'
    },
    budgetLimit: {
        type: Number,
        default: 0
    },
    icon: {
        type: String,
        default: '💳'
    }
}, { timestamps: true });

export default mongoose.model('Category', categorySchema); 
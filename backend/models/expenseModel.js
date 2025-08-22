import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    uid: String, // Firebase UID
    title: String,
    amount: Number,
    category: String,
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema); 
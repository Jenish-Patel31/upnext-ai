import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
    uid: String, // Firebase UID
    goal: String,
    steps: [String],
    category: {
        type: String,
        default: 'general',
    },
    /** Rough monthly cash the user expects this plan to need (₹). Used for affordability checks. */
    estimatedMonthlyAmount: {
        type: Number,
        default: 0,
    },
    /** Planning horizon in months (long-term default 12). */
    horizonMonths: {
        type: Number,
        default: 12,
    },
    /**
     * budgeted: normal affordability checks apply.
     * flexible: intent-only / placeholder — skip take-home and stacking caps when saving from chat or API.
     */
    commitmentMode: {
        type: String,
        enum: ['budgeted', 'flexible'],
        default: 'budgeted',
    },
    completed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export default mongoose.model('Plan', planSchema); 
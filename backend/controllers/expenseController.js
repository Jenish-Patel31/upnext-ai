import Expense from '../models/expenseModel.js';

export const addExpense = async (req, res) => {
    try {
        const { uid, title, amount, category } = req.body;
        
        // Validate required fields
        if (!uid || !title || !amount || !category) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['uid', 'title', 'amount', 'category'],
                received: { uid, title, amount, category }
            });
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ 
                error: 'Invalid amount. Must be a positive number.',
                received: amount 
            });
        }

        const newExpense = new Expense({
            uid,
            title: title.trim(),
            amount: parseFloat(amount),
            category: category.trim()
        });

        const savedExpense = await newExpense.save();
        
        res.status(201).json({
            message: "Expense added successfully",
            expense: savedExpense
        });
    } catch (error) {
        // Handle specific MongoDB errors
        if (error.name === 'MongoServerError') {
            if (error.code === 11000) {
                return res.status(400).json({ 
                    error: 'Duplicate expense entry',
                    details: 'An expense with the same details already exists'
                });
            }
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({ 
            error: 'Failed to add expense',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const getExpensesByUser = async (req, res) => {
    try {
        const { uid } = req.params;
        
        if (!uid) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const expenses = await Expense.find({ uid }).sort({ date: -1 });
        
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch expenses',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const deleteExpense = async (req, res) => {
    try {
        const { expenseId } = req.params;
        
        if (!expenseId) {
            return res.status(400).json({ error: 'Expense ID is required' });
        }

        const deletedExpense = await Expense.findByIdAndDelete(expenseId);
        
        if (!deletedExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.status(200).json({
            message: "Expense deleted successfully",
            expense: deletedExpense
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to delete expense',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const updateExpense = async (req, res) => {
    try {
        const { expenseId } = req.params;
        const { title, amount, category, date } = req.body;
        
        if (!expenseId) {
            return res.status(400).json({ error: 'Expense ID is required' });
        }

        // Validate amount if provided
        if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
            return res.status(400).json({ 
                error: 'Invalid amount. Must be a positive number.',
                received: amount 
            });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (category !== undefined) updateData.category = category.trim();
        if (date !== undefined) updateData.date = date;

        const updatedExpense = await Expense.findByIdAndUpdate(
            expenseId,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.status(200).json({
            message: "Expense updated successfully",
            expense: updatedExpense
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({ 
            error: 'Failed to update expense',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}; 
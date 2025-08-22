import Category from '../models/categoryModel.js';
import Expense from '../models/expenseModel.js';

export const addCategory = async (req, res) => {
    try {
        const { uid, name, color, budgetLimit, icon } = req.body;
        
        // Validate required fields
        if (!uid || !name || !budgetLimit) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['uid', 'name', 'budgetLimit'],
                received: { uid, name, color, budgetLimit, icon }
            });
        }

        // Validate budget limit
        if (isNaN(budgetLimit) || budgetLimit < 0) {
            return res.status(400).json({ 
                error: 'Invalid budget limit. Must be a non-negative number.',
                received: budgetLimit 
            });
        }

        // Check if category name already exists for this user
        const existingCategory = await Category.findOne({ uid, name: name.trim() });
        if (existingCategory) {
            return res.status(400).json({ 
                error: 'Category with this name already exists',
                existingCategory: existingCategory.name
            });
        }

        const newCategory = new Category({
            uid,
            name: name.trim(),
            color: color || '#3B82F6',
            budgetLimit: parseFloat(budgetLimit),
            icon: icon || '💳'
        });

        const savedCategory = await newCategory.save();
        
        res.status(201).json({
            message: "Category added successfully",
            category: savedCategory
        });
    } catch (error) {
        // Handle specific MongoDB errors
        if (error.name === 'MongoServerError') {
            if (error.code === 11000) {
                return res.status(400).json({ 
                    error: 'Duplicate category entry',
                    details: 'A category with the same name already exists for this user'
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
            error: 'Failed to add category',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const getCategoriesByUser = async (req, res) => {
    try {
        const { uid } = req.params;
        
        if (!uid) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const categories = await Category.find({ uid }).sort({ createdAt: -1 });
        
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch categories',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        
        if (!categoryId) {
            return res.status(400).json({ error: 'Category ID is required' });
        }
        
        // Find the category first to get its name
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Delete the category
        const deletedCategory = await Category.findByIdAndDelete(categoryId);
        
        // Delete all expenses in this category
        const deleteResult = await Expense.deleteMany({ category: category.name });

        res.status(200).json({
            message: "Category and related expenses deleted successfully",
            category: deletedCategory,
            deletedExpensesCount: deleteResult.deletedCount
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to delete category',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}; 
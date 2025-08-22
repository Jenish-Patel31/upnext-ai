import User from '../models/userModel.js';

export const createUser = async (req, res) => {
    try {
        const { uid, name, email } = req.body;
        
        // Validate required fields
        if (!uid || !name || !email) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['uid', 'name', 'email'],
                received: { uid, name, email }
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                error: 'Invalid email format',
                received: email
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ uid });
        if (existingUser) {
            return res.status(200).json({
                message: "User already exists",
                user: existingUser
            });
        }

        // Create new user
        const newUser = new User({
            uid,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            goals: [],
            preferences: {
                riskProfile: 'moderate',
                budget: 0
            },
            pastMessages: []
        });

        const savedUser = await newUser.save();
        
        res.status(201).json({
            message: "User created successfully",
            user: savedUser
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: Object.values(error.errors).map(err => err.message)
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({ 
                error: 'User with this email already exists',
                details: 'A user with this email address is already registered'
            });
        }

        res.status(500).json({ 
            error: 'Failed to create user',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const getUser = async (req, res) => {
    try {
        const { uid } = req.params;
        
        if (!uid) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const user = await User.findOne({ uid });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: "User fetched successfully",
            user
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch user',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { uid } = req.params;
        const { name, email, goals, preferences } = req.body;
        
        if (!uid) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (email !== undefined) updateData.email = email.trim().toLowerCase();
        if (goals !== undefined) updateData.goals = goals;
        if (preferences !== undefined) updateData.preferences = preferences;

        const updatedUser = await User.findOneAndUpdate(
            { uid },
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: "User updated successfully",
            user: updatedUser
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({ 
            error: 'Failed to update user',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { uid } = req.params;
        
        if (!uid) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const deletedUser = await User.findOneAndDelete({ uid });
        
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: "User deleted successfully",
            user: deletedUser
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to delete user',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}; 
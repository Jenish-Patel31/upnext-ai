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

        // Check if user already exists — refresh name/email from Firebase on each sync
        const existingUser = await User.findOne({ uid });
        if (existingUser) {
            let changed = false;
            const nextName = name.trim();
            const nextEmail = email.trim().toLowerCase();
            if (nextName && existingUser.name !== nextName) {
                existingUser.name = nextName;
                changed = true;
            }
            if (nextEmail && existingUser.email !== nextEmail) {
                existingUser.email = nextEmail;
                changed = true;
            }
            if (changed) await existingUser.save();
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
        const {
            name,
            email,
            goals,
            preferences,
            phone,
            location,
            bio,
            dateOfBirth,
            occupation,
            company,
        } = req.body;
        
        if (!uid) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = typeof name === 'string' ? name.trim() : name;
        if (email !== undefined) updateData.email = typeof email === 'string' ? email.trim().toLowerCase() : email;
        if (goals !== undefined) updateData.goals = goals;
        if (preferences !== undefined) updateData.preferences = preferences;
        if (phone !== undefined) updateData.phone = typeof phone === 'string' ? phone.trim() : phone;
        if (location !== undefined) updateData.location = typeof location === 'string' ? location.trim() : location;
        if (bio !== undefined) updateData.bio = typeof bio === 'string' ? bio.trim() : bio;
        if (dateOfBirth !== undefined) updateData.dateOfBirth = typeof dateOfBirth === 'string' ? dateOfBirth.trim() : dateOfBirth;
        if (occupation !== undefined) updateData.occupation = typeof occupation === 'string' ? occupation.trim() : occupation;
        if (company !== undefined) updateData.company = typeof company === 'string' ? company.trim() : company;

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
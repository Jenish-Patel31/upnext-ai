import Plan from '../models/planModel.js';

export const createPlan = async (req, res) => {
    try {
        const { uid, goal, steps } = req.body;
        
        // Validate required fields
        if (!uid || !goal) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['uid', 'goal'],
                received: { uid, goal, steps: !!steps }
            });
        }

        // Validate goal
        if (typeof goal !== 'string' || goal.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Goal must be a non-empty string',
                received: goal
            });
        }

        // Validate steps if provided
        if (steps && (!Array.isArray(steps) || steps.some(step => typeof step !== 'string' || step.trim().length === 0))) {
            return res.status(400).json({ 
                error: 'Steps must be an array of non-empty strings',
                received: steps
            });
        }

        const newPlan = new Plan({
            uid,
            goal: goal.trim(),
            steps: steps ? steps.map(step => step.trim()).filter(step => step.length > 0) : []
        });

        const savedPlan = await newPlan.save();
        
        res.status(201).json({
            message: "Plan created successfully",
            plan: savedPlan
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({ 
            error: 'Failed to create plan',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const getPlansByUser = async (req, res) => {
    try {
        const { uid } = req.params;
        
        if (!uid) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const plans = await Plan.find({ uid }).sort({ createdAt: -1 });
        
        res.status(200).json(plans);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch plans',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const completePlan = async (req, res) => {
    try {
        const { planId } = req.params;
        
        if (!planId) {
            return res.status(400).json({ error: 'Plan ID is required' });
        }

        const plan = await Plan.findByIdAndUpdate(
            planId,
            { completed: true, completedAt: new Date() },
            { new: true, runValidators: true }
        );
        
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        res.status(200).json({
            message: "Plan marked as complete successfully",
            plan
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({ 
            error: 'Failed to complete plan',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Add new function to update plan
export const updatePlan = async (req, res) => {
    try {
        const { planId } = req.params;
        const { goal, steps, completed } = req.body;
        
        if (!planId) {
            return res.status(400).json({ error: 'Plan ID is required' });
        }

        const updateData = {};
        if (goal !== undefined) updateData.goal = goal.trim();
        if (steps !== undefined) updateData.steps = steps.map(step => step.trim()).filter(step => step.length > 0);
        if (completed !== undefined) updateData.completed = completed;

        const updatedPlan = await Plan.findByIdAndUpdate(
            planId,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedPlan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        res.status(200).json({
            message: "Plan updated successfully",
            plan: updatedPlan
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({ 
            error: 'Failed to update plan',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Add new function to delete plan
export const deletePlan = async (req, res) => {
    try {
        const { planId } = req.params;
        
        if (!planId) {
            return res.status(400).json({ error: 'Plan ID is required' });
        }

        const deletedPlan = await Plan.findByIdAndDelete(planId);
        
        if (!deletedPlan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        res.status(200).json({
            message: "Plan deleted successfully",
            plan: deletedPlan
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to delete plan',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}; 
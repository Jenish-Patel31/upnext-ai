import Plan from '../models/planModel.js';
import User from '../models/userModel.js';
import { assertPlanAffordable } from '../utils/planAffordability.js';

export const createPlan = async (req, res) => {
    try {
        const {
            uid,
            goal,
            steps,
            category,
            estimatedMonthlyAmount,
            horizonMonths,
            commitmentMode,
            flexible,
        } = req.body;
        
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

        const mode =
            commitmentMode === 'flexible' || flexible === true ? 'flexible' : 'budgeted';

        const planPayload = {
            category: category || 'general',
            estimatedMonthlyAmount: estimatedMonthlyAmount != null ? Number(estimatedMonthlyAmount) : 0,
            horizonMonths: horizonMonths != null ? Number(horizonMonths) : 12,
            flexible: mode === 'flexible',
            commitmentMode: mode,
        };

        const check = await assertPlanAffordable(uid, planPayload, null);
        if (!check.ok) {
            return res.status(400).json({ error: check.error });
        }

        const newPlan = new Plan({
            uid,
            goal: goal.trim(),
            steps: steps ? steps.map(step => step.trim()).filter(step => step.length > 0) : [],
            category: planPayload.category,
            estimatedMonthlyAmount: planPayload.estimatedMonthlyAmount,
            horizonMonths: planPayload.horizonMonths,
            commitmentMode: mode,
        });

        const savedPlan = await newPlan.save();

        await User.findOneAndUpdate(
            { uid },
            { $addToSet: { goals: goal.trim() } }
        );
        
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
        const {
            goal,
            steps,
            completed,
            category,
            estimatedMonthlyAmount,
            horizonMonths,
            commitmentMode,
            flexible,
        } = req.body;
        
        if (!planId) {
            return res.status(400).json({ error: 'Plan ID is required' });
        }

        const existing = await Plan.findById(planId);
        if (!existing) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        const updateData = {};
        if (goal !== undefined) updateData.goal = goal.trim();
        if (steps !== undefined) updateData.steps = steps.map(step => step.trim()).filter(step => step.length > 0);
        if (completed !== undefined) updateData.completed = completed;
        if (category !== undefined) updateData.category = String(category).trim();
        if (estimatedMonthlyAmount !== undefined) updateData.estimatedMonthlyAmount = Number(estimatedMonthlyAmount);
        if (horizonMonths !== undefined) updateData.horizonMonths = Number(horizonMonths);
        if (commitmentMode !== undefined) updateData.commitmentMode = commitmentMode;
        if (flexible === true) updateData.commitmentMode = 'flexible';

        const mergedMode =
            updateData.commitmentMode ??
            existing.commitmentMode ??
            'budgeted';

        const merged = {
            category: updateData.category ?? existing.category ?? 'general',
            estimatedMonthlyAmount:
                updateData.estimatedMonthlyAmount !== undefined
                    ? Number(updateData.estimatedMonthlyAmount)
                    : Number(existing.estimatedMonthlyAmount) || 0,
            horizonMonths:
                updateData.horizonMonths !== undefined
                    ? Number(updateData.horizonMonths)
                    : Number(existing.horizonMonths) || 12,
            flexible: mergedMode === 'flexible',
            commitmentMode: mergedMode,
        };

        const check = await assertPlanAffordable(existing.uid, merged, planId);
        if (!check.ok) {
            return res.status(400).json({ error: check.error });
        }

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
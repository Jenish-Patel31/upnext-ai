import express from 'express';
import { createPlan, getPlansByUser, completePlan, updatePlan, deletePlan } from '../controllers/planController.js';

const router = express.Router();

router.post('/create', createPlan);
router.get('/:uid', getPlansByUser);
router.patch('/complete/:planId', completePlan);
router.put('/:planId', updatePlan);
router.delete('/:planId', deletePlan);

export default router; 
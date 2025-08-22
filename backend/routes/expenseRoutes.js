import express from 'express';
import { addExpense, getExpensesByUser, deleteExpense, updateExpense } from '../controllers/expenseController.js';

const router = express.Router();

router.post('/add', addExpense);
router.get('/:uid', getExpensesByUser);
router.delete('/:expenseId', deleteExpense);
router.put('/:expenseId', updateExpense);

export default router; 
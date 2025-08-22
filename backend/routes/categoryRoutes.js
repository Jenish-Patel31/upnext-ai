import express from 'express';
import { addCategory, getCategoriesByUser, deleteCategory } from '../controllers/categoryController.js';

const router = express.Router();

router.post('/add', addCategory);
router.get('/:uid', getCategoriesByUser);
router.delete('/:categoryId', deleteCategory);

export default router; 
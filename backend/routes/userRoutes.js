import express from 'express';
import { createUser, getUser, updateUser, deleteUser } from '../controllers/userController.js';

const router = express.Router();

router.post('/create', createUser);
router.get('/:uid', getUser);
router.put('/:uid', updateUser);
router.delete('/:uid', deleteUser);

export default router; 
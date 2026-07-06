import express from 'express';
import { getProblems } from '../controllers/problemController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// When the frontend hits /api/problems with a GET request, run getProblems
router.get('/', protect, getProblems);

export default router;
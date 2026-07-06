import express from 'express';
import { executeCode } from '../controllers/executeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Route the POST request directly to our controller, now protected
router.post('/', protect, executeCode);

export default router;
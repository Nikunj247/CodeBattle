import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET top 50 users by Elo Rating
router.get('/leaderboard', protect, async (req, res) => {
  try {
    // Find all users, grab only their username and elo, sort descending, limit 50
    const topUsers = await User.find()
      .select('username eloRating') 
      .sort({ eloRating: -1 }) 
      .limit(50);
      
    res.json(topUsers);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

router.get('/:userId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('username eloRating');
    res.json(user);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ error: "Failed to fetch user stats" });
  }
});

export default router;
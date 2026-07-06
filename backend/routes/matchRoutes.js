import express from 'express';
import Match from '../models/Match.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET an array of problem IDs that a specific user has successfully solved (won)
router.get('/:userId/solved', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find all matches where this user is the winner
    const wonMatches = await Match.find({ winner: userId }).select('problems');
    
    // Flatten the arrays and remove duplicates to get a clean list of IDs
    const solvedProblemIds = [...new Set(wonMatches.flatMap(match => match.problems.map(id => id.toString())))];
    
    res.json(solvedProblemIds);
  } catch (error) {
    console.error("Error fetching solved problems:", error);
    res.status(500).json({ error: "Failed to fetch solved problems" });
  }
});

// GET all recent matches for a specific user
router.get('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all matches where this user was either the winner or the loser
    const matches = await Match.find({ players: userId })
      .populate('winner', 'username') // Pull in the username of the winner
      .populate('loser', 'username')  // Pull in the username of the loser
      .populate('problems', 'title')  // Pull in the titles of the problems solved
      .sort({ createdAt: -1 })        // Sort by newest first
      .limit(10);                     // Only grab the 10 most recent

    res.json(matches);
  } catch (error) {
    console.error("Error fetching match history:", error);
    res.status(500).json({ error: "Failed to fetch match history" });
  }
});

export default router;
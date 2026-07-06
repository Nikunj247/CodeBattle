import Problem from '../models/Problem.js';

// @desc    Fetch all problems
// @route   GET /api/problems
// @access  Public
export const getProblems = async (req, res) => {
  try {
    // Fetch all problems from the database, but exclude the hidden test cases 
    // so users can't cheat by looking at the network tab!
    const problems = await Problem.find({}).select('-testCases');
    
    res.status(200).json(problems);
  } catch (error) {
    console.error(`Error fetching problems: ${error.message}`);
    res.status(500).json({ message: 'Server Error: Could not fetch problems' });
  }
};
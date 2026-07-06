import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  // Gamification & Matchmaking Stats
  eloRating: {
    type: Number,
    default: 1000 // Standard starting Elo in competitive games
  },
  matchesPlayed: {
    type: Number,
    default: 0
  },
  wins: {
    type: Number,
    default: 0
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  solvedProblems: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Problem' 
  }]
}, { timestamps: true }); // Automatically adds createdAt and updatedAt dates

export default mongoose.model('User', userSchema);
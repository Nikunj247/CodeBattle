import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  eloChanges: {
    winnerGain: { type: Number, required: true },
    loserLoss: { type: Number, required: true }
  }
}, { timestamps: true }); // Automatically adds createdAt so we know when the match happened

const Match = mongoose.model('Match', matchSchema);
export default Match;
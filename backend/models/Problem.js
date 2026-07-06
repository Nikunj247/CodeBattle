import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'], // Forces it to only be one of these three
    required: true
  },
  topic: {
    type: String,
    required: true // e.g., 'Graphs', 'Dynamic Programming'
  },
  description: {
    type: String,
    required: true
  },
  // The starter code that appears in the editor when the match starts
  starterCode: {
    cpp: { type: String, required: true },
    java: { type: String, required: true }
  },
  driverCode: {
    cpp: { type: String, required: true },
    java: { type: String, required: true }
  },
  // The hidden test cases used by the backend execution engine
  testCases: [
    {
      input: { type: String, required: true },
      expectedOutput: { type: String, required: true }
    }
  ]
}, { timestamps: true });

export default mongoose.model('Problem', problemSchema);
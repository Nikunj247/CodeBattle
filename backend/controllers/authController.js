import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Helper function to generate a JWT token
const generateToken = (id) => {
  // Now packaging it specifically as 'userId'
  return jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @desc    Register a new user
// @route   POST /api/auth/register
// @desc    Register a new user
// @route   POST /api/auth/register
// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  console.log(`\n--- REGISTRATION ATTEMPT ---`);
  console.log(`Data received from frontend:`, req.body);

  const { username, email, password } = req.body;

  // DEBUG 1: Did we get all the fields?
  if (!username || !email || !password) {
    console.log("❌ ERROR: Missing fields! Frontend didn't send everything.");
    return res.status(400).json({ message: 'Please fill in all fields' });
  }

  try {
    console.log("Checking if username exists in DB...");
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      console.log("❌ ERROR: Username taken.");
      return res.status(400).json({ message: 'This username is taken' });
    }

    console.log("Checking if email exists in DB...");
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      console.log("❌ ERROR: Email taken.");
      return res.status(400).json({ message: 'This email is already registered, try login' });
    }

    console.log("Hashing password...");
    // === THE ENCRYPTION BLOCK ===
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Password hashed successfully!");

    console.log("Saving user to database...");
    const user = await User.create({
      username,
      email,
      password: hashedPassword 
    });

    console.log(`✅ SUCCESS! User created with ID: ${user._id}`);
    console.log(`----------------------------\n`);
    
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      eloRating: user.eloRating,
      token: generateToken(user._id)
    });

  } catch (error) {
    // DEBUG 2: If it crashes, print the EXACT reason to the terminal
    console.error("\n❌ FATAL REGISTRATION SERVER ERROR ❌");
    console.error(error);
    
    // Send the actual error message to the frontend so we can read it on the screen
    res.status(500).json({ message: `Server Crash: ${error.message}` });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @desc    Authenticate a user (Login)
// @route   POST /api/auth/login
// @desc    Authenticate a user (Login)
// @route   POST /api/auth/login
// @desc    Authenticate a user (Login)
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  
  // DEBUG 1: See exactly what React is sending to the backend
  console.log(`\n--- LOGIN ATTEMPT ---`);
  console.log(`Username received: "${username}"`);
  console.log(`Password received: "${password ? '***' : 'MISSING'}"`);

  try {
    const user = await User.findOne({ username });
    
    // DEBUG 2: Did we find the user in the database?
    console.log(`User found in DB?: ${user ? 'YES' : 'NO'}`);

    if (!user) {
      return res.status(400).json({ message: 'User not found. Check your spelling (Case Sensitive)!' });
    }

    // DEBUG 3: Does the database password look like a hash? (Hashes usually start with $2a$ or $2b$)
    console.log(`DB Password starts with: ${user.password.substring(0, 4)}`);

    const isMatch = await bcrypt.compare(password, user.password);
    
    // DEBUG 4: Did the passwords match?
    console.log(`Password Match?: ${isMatch ? 'YES' : 'NO'}`);
    console.log(`---------------------\n`);

    if (isMatch) {
      res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        eloRating: user.eloRating,
        token: generateToken(user._id) 
      });
    } else {
      res.status(400).json({ message: 'Incorrect password!' });
    }
  } catch (error) {
    console.error("Login Server Error:", error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
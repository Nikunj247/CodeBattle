import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Check if the token exists in the Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract the token (Format: "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token using your secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch the user from the DB and attach it to the request object (excluding the password)
      req.user = await User.findById(decoded.userId).select('-password');
      
      next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      return res.status(401).json({ message: 'Not authorized, token failed or expired.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided.' });
  }
};
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http'; 
import { Server } from 'socket.io';  
import connectDB from './config/db.js';
import problemRoutes from './routes/problemRoutes.js';
import executeRoutes from './routes/executeRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { handleSockets } from './socket/socketHandler.js'; 
import matchRoutes from './routes/matchRoutes.js';
import userRoutes from './routes/userRoutes.js';
import rateLimit from 'express-rate-limit';

// Connect to MongoDB Atlas / Local
connectDB();

const app = express();

// Upgrade Express to an HTTP server for WebSockets
const httpServer = createServer(app);

// Attach Socket.io to the HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // <-- THIS FIXES THE SILENT CONNECTION DROP ON PORT 5174
    methods: ["GET", "POST"]
  }
});

// Standard Express Middleware
app.use(cors());
app.use(express.json());

const executeLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 seconds
  max: 1, // Limit each IP to 1 request per windowMs
  message: { message: "⚠️ Execution engine cooling down. Please wait 5 seconds between runs." },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// API Routes
app.use('/api/problems', problemRoutes);
app.use('/api/execute', executeLimiter, executeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/users', userRoutes);

// Base test route
app.get('/', (req, res) => {
  res.send('CodeBattle API is running...');
});

// Initialize your matchmaking logic
handleSockets(io);

const PORT = process.env.PORT || 5000;

// Start the server using httpServer, NOT app
httpServer.listen(PORT, () => {
  console.log(`Server is running in development mode on port ${PORT}`);
});
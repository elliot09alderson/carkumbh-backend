import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import configureCloudinary from './config/cloudinary.js';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payments.js';
import siteConfigRoutes from './routes/siteConfigRoutes.js';
import studentRoutes from './routes/students.js';
import { getEventPackages } from './controllers/siteConfigController.js';

dotenv.config();

const app = express();

// Rate limiting - prevent spam/abuse
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: { message: 'Too many requests, please try again later.' },
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 payment attempts per 15 minutes per IP
  message: { message: 'Too many payment attempts, please try again later.' },
});

app.use(generalLimiter);

// Connect to Database
connectDB();

// Configure Cloudinary
configureCloudinary();

// Middleware - Allow multiple frontend origins
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  "http://localhost:8081",
  'https://www.toransir.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);

    // In production, check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log the rejected origin for debugging
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/config', siteConfigRoutes);
app.use('/api/students', studentRoutes);
app.get('/api/event-packages', getEventPackages);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

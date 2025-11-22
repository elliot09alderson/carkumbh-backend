import express from 'express';
import { createOrder, verifyPayment, getPriceBreakdown } from '../controllers/paymentController.js';

const router = express.Router();

// Create Razorpay order
router.post('/create-order', createOrder);

// Verify payment and create booking
router.post('/verify', verifyPayment);

// Get price breakdown for a package
router.get('/price-breakdown/:package', getPriceBreakdown);

export default router;

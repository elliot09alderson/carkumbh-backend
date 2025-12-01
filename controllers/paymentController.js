import crypto from 'crypto';
import razorpay from '../config/razorpay.js';
import Booking from '../models/Booking.js';

// Calculate GST (18% on base amount)
const calculateGST = (baseAmount) => {
  const gst = baseAmount * 0.18; // 18% GST
  return Math.round(gst); // Round to nearest rupee
};

// Generate unique 6-character token
const generateToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Public
export const createOrder = async (req, res) => {
  try {
    const { name, number, address, package: packageAmount } = req.body;

    // Validate required fields
    if (!name || !number || !address || !packageAmount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate package
    if (!['499', '999'].includes(packageAmount)) {
      return res.status(400).json({ message: 'Invalid package selected' });
    }

    const baseAmount = parseInt(packageAmount);
    const gstAmount = calculateGST(baseAmount);
    const totalAmount = baseAmount + gstAmount;

    // Create Razorpay order
    const options = {
      amount: totalAmount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        name,
        number,
        address,
        package: packageAmount,
        baseAmount: baseAmount.toString(),
        gstAmount: gstAmount.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      baseAmount,
      gstAmount,
      totalAmount,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
};

// @desc    Verify payment and create booking
// @route   POST /api/payments/verify
// @access  Public
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      name,
      number,
      address,
      package: packageAmount,
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification data missing' });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Generate unique token
    let token;
    let isUnique = false;
    while (!isUnique) {
      token = generateToken();
      const existingBooking = await Booking.findOne({ token });
      if (!existingBooking) {
        isUnique = true;
      }
    }

    // Calculate amounts for storage
    const baseAmount = parseInt(packageAmount);
    const gstAmount = calculateGST(baseAmount);
    const totalAmount = baseAmount + gstAmount;

    // Create booking
    const booking = await Booking.create({
      token,
      name,
      number,
      address,
      package: packageAmount,
      paymentMode: 'online',
      isPaid: true,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      gstAmount,
      totalAmountPaid: totalAmount,
    });

    res.status(201).json({
      success: true,
      message: 'Payment verified and booking created',
      token: booking.token,
      booking,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

// @desc    Get price breakdown
// @route   GET /api/payments/price-breakdown/:package
// @access  Public
export const getPriceBreakdown = async (req, res) => {
  try {
    const { package: packageAmount } = req.params;

    if (!['499', '999'].includes(packageAmount)) {
      return res.status(400).json({ message: 'Invalid package' });
    }

    const baseAmount = parseInt(packageAmount);
    const gstAmount = calculateGST(baseAmount);
    const totalAmount = baseAmount + gstAmount;

    res.status(200).json({
      baseAmount,
      gstAmount,
      totalAmount,
      breakdown: {
        gst: gstAmount,
      },
    });
  } catch (error) {
    console.error('Price breakdown error:', error);
    res.status(500).json({ message: 'Failed to get price breakdown' });
  }
};

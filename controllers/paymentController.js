import crypto from 'crypto';
import razorpay from '../config/razorpay.js';
import Booking from '../models/Booking.js';
import SiteConfig from '../models/SiteConfig.js';

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

// Helper function to get valid package prices from database
const getValidPackagePrices = async () => {
  try {
    const config = await SiteConfig.findOne({ key: 'event_packages' });
    if (config && Array.isArray(config.value)) {
      return config.value.map(pkg => pkg.price);
    }
    // Default packages if none in database
    return ['10000', '999', '500'];
  } catch (error) {
    console.error('Error fetching packages:', error);
    return ['10000', '999', '500'];
  }
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

    // Get valid packages from database
    const validPackages = await getValidPackagePrices();
    
    // Validate package
    if (!validPackages.includes(packageAmount)) {
      return res.status(400).json({ message: `Invalid package selected. Valid packages: ₹${validPackages.join(', ₹')}` });
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
      console.log('Missing verification data:', { razorpay_order_id, razorpay_payment_id, razorpay_signature });
      return res.status(400).json({ message: 'Payment verification data missing' });
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    console.log('Verification attempt:');
    console.log('- Order ID:', razorpay_order_id);
    console.log('- Payment ID:', razorpay_payment_id);
    console.log('- Secret length:', secret ? secret.length : 'undefined');
    console.log('- Secret first 4 chars:', secret ? secret.substring(0, 4) : 'undefined');
    
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    console.log('- Expected signature:', expectedSignature);
    console.log('- Received signature:', razorpay_signature);
    console.log('- Signatures match:', expectedSignature === razorpay_signature);

    if (expectedSignature !== razorpay_signature) {
      console.log('SIGNATURE MISMATCH - Check RAZORPAY_KEY_SECRET');
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

    // Get valid packages from database
    const validPackages = await getValidPackagePrices();

    if (!validPackages.includes(packageAmount)) {
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


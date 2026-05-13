import Booking from '../models/Booking.js';
import { uploadToCloudinary } from '../middleware/upload.js';
import { cloudinary } from '../config/cloudinary.js';

// Generate Token
const generateToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const createBooking = async (req, res) => {
  try {
    const { name, number, address, package: packageType, paymentMode } = req.body;

    if (!name || !number || !address || !packageType || !paymentMode) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    let screenshotUrl = null;
    let screenshotPublicId = null;

    if (paymentMode === 'online' && req.file) {
      try {
        const result = await uploadToCloudinary(req.file);
        screenshotUrl = result.secure_url;
        screenshotPublicId = result.public_id;
      } catch (uploadError) {
        return res.status(500).json({ message: 'Error uploading screenshot' });
      }
    }

    let token = generateToken();
    let tokenExists = await Booking.findOne({ token });

    while (tokenExists) {
      token = generateToken();
      tokenExists = await Booking.findOne({ token });
    }

    const booking = await Booking.create({
      token,
      name,
      number,
      address,
      package: packageType,
      paymentMode,
      isPaid: paymentMode === 'online',
      screenshotUrl,
      screenshotPublicId,
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({}).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      res.json(booking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const togglePaidStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      booking.isPaid = !booking.isPaid;
      const updatedBooking = await booking.save();
      res.json(updatedBooking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      if (booking.screenshotPublicId) {
        try {
          await cloudinary.uploader.destroy(booking.screenshotPublicId);
        } catch (cloudinaryError) {
          console.error('Error deleting from Cloudinary:', cloudinaryError);
        }
      }
      await Booking.deleteOne({ _id: req.params.id });
      res.json({ message: 'Booking removed' });
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAllBookings = async (req, res) => {
  try {
    const bookingsWithScreenshots = await Booking.find({ screenshotPublicId: { $ne: null } });
    for (const booking of bookingsWithScreenshots) {
      try {
        await cloudinary.uploader.destroy(booking.screenshotPublicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
      }
    }
    const result = await Booking.deleteMany({});
    res.json({ message: `${result.deletedCount} bookings deleted` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBookingsByPackage = async (req, res) => {
  try {
    const { packageType } = req.params;
    const bookingsWithScreenshots = await Booking.find({ 
      package: packageType, 
      screenshotPublicId: { $ne: null } 
    });
    for (const booking of bookingsWithScreenshots) {
      try {
        await cloudinary.uploader.destroy(booking.screenshotPublicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
      }
    }
    const result = await Booking.deleteMany({ package: packageType });
    res.json({ message: `${result.deletedCount} bookings with package ₹${packageType} deleted` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const scanTicket = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const booking = await Booking.findOne({ token: token.trim().toUpperCase() });

    if (!booking) {
      return res.status(404).json({ message: 'Invalid ticket — booking not found' });
    }

    if (!booking.isPaid) {
      return res.status(402).json({ 
        message: 'Payment pending — entry not allowed',
        booking: { name: booking.name, package: booking.package, token: booking.token }
      });
    }

    if (booking.isScanned) {
      return res.status(409).json({ 
        message: 'Ticket already used',
        scannedAt: booking.scannedAt,
        booking: { name: booking.name, package: booking.package, token: booking.token, number: booking.number }
      });
    }

    booking.isScanned = true;
    booking.scannedAt = new Date();
    await booking.save();

    res.json({
      message: 'Entry granted',
      booking: {
        name: booking.name,
        number: booking.number,
        package: booking.package,
        token: booking.token,
        paymentMode: booking.paymentMode,
        isPaid: booking.isPaid,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  bulkCreateBookings,
  getBulkBookings,
  deleteBulkBookings,
  createBooking,
  getAllBookings,
  getBookingById,
  togglePaidStatus,
  deleteBooking,
  deleteAllBookings,
  deleteBookingsByPackage,
  scanTicket,
};

const bulkCreateBookings = async (req, res) => {
  try {
    const { count, label, packageName } = req.body;

    if (!count || count < 1 || count > 500) {
      return res.status(400).json({ message: 'Count must be between 1 and 500' });
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const generateToken = () =>
      Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    const bookings = [];
    const tokens = [];
    let attempts = 0;

    while (bookings.length < count && attempts < count * 5) {
      attempts++;
      const token = generateToken();
      const exists = await Booking.findOne({ token });
      if (exists) continue;

      bookings.push({
        token,
        name: label || 'Bulk Ticket',
        number: '0000000000',
        address: 'Bulk Generated',
        package: packageName || 'General',
        paymentMode: 'cash',
        isPaid: true,
        isScanned: false,
      });
      tokens.push(token);
    }

    await Booking.insertMany(bookings);
    res.json({ tokens, count: tokens.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBulkBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ address: 'Bulk Generated' }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBulkBookings = async (req, res) => {
  try {
    const { ids } = req.body;
    if (ids && Array.isArray(ids) && ids.length > 0) {
      await Booking.deleteMany({ _id: { $in: ids }, address: 'Bulk Generated' });
      res.json({ message: `${ids.length} tickets deleted` });
    } else {
      const result = await Booking.deleteMany({ address: 'Bulk Generated' });
      res.json({ message: `${result.deletedCount} tickets deleted` });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

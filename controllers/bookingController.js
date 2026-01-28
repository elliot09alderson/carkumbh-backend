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

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Public
const createBooking = async (req, res) => {
  try {
    const { name, number, address, package: packageType, paymentMode } = req.body;

    if (!name || !number || !address || !packageType || !paymentMode) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    let screenshotUrl = null;
    let screenshotPublicId = null;

    // If online payment, upload screenshot to Cloudinary
    if (paymentMode === 'online' && req.file) {
      try {
        const result = await uploadToCloudinary(req.file);
        screenshotUrl = result.secure_url;
        screenshotPublicId = result.public_id;
      } catch (uploadError) {
        return res.status(500).json({ message: 'Error uploading screenshot' });
      }
    }

    // Generate unique token
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

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private (Admin only)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({}).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private (Admin only)
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

// @desc    Toggle paid status
// @route   PATCH /api/bookings/:id/toggle-paid
// @access  Private (Admin only)
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

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin only)
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (booking) {
      // Delete screenshot from Cloudinary if exists
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

// @desc    Delete all bookings
// @route   DELETE /api/bookings
// @access  Private (Admin only)
const deleteAllBookings = async (req, res) => {
  try {
    // Get all bookings with screenshots to delete from Cloudinary
    const bookingsWithScreenshots = await Booking.find({ screenshotPublicId: { $ne: null } });
    
    // Delete screenshots from Cloudinary
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

// @desc    Delete bookings by package
// @route   DELETE /api/bookings/by-package/:packageType
// @access  Private (Admin only)
const deleteBookingsByPackage = async (req, res) => {
  try {
    const { packageType } = req.params;
    
    // Get bookings with screenshots to delete from Cloudinary
    const bookingsWithScreenshots = await Booking.find({ 
      package: packageType, 
      screenshotPublicId: { $ne: null } 
    });
    
    // Delete screenshots from Cloudinary
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

export {
  createBooking,
  getAllBookings,
  getBookingById,
  togglePaidStatus,
  deleteBooking,
  deleteAllBookings,
  deleteBookingsByPackage,
};

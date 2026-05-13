import express from 'express';
import {
  createBooking,
  getAllBookings,
  getBookingById,
  togglePaidStatus,
  deleteBooking,
  deleteAllBookings,
  deleteBookingsByPackage,
  scanTicket,
  bulkCreateBookings,
  getBulkBookings,
  deleteBulkBookings,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.post('/', upload.single('screenshot'), createBooking);

// Protected routes (Admin only)
router.post("/scan", protect, scanTicket);
router.post("/bulk", protect, bulkCreateBookings);
router.get("/bulk", protect, getBulkBookings);
router.delete("/bulk", protect, deleteBulkBookings);
router.get('/', protect, getAllBookings);
router.delete('/all', protect, deleteAllBookings);
router.delete('/by-package/:packageType', protect, deleteBookingsByPackage);
router.get('/:id', protect, getBookingById);
router.patch('/:id/toggle-paid', protect, togglePaidStatus);
router.delete('/:id', protect, deleteBooking);

export default router;

import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  package: {
    type: String,
    required: true,
    enum: ['499', '999'],
  },
  paymentMode: {
    type: String,
    required: true,
    enum: ['cash', 'online'],
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  screenshotUrl: {
    type: String,
    default: null,
  },
  screenshotPublicId: {
    type: String,
    default: null,
  },
  razorpayOrderId: {
    type: String,
    default: null,
  },
  razorpayPaymentId: {
    type: String,
    default: null,
  },
  gstAmount: {
    type: Number,
    default: 0,
  },
  totalAmountPaid: {
    type: Number,
    default: null,
  },
}, {
  timestamps: true,
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;

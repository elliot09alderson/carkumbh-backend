import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
  },
  whatsappNumber: {
    type: String,
    required: true,
  },
  highestQualification: {
    type: String,
    required: true,
  },
  workingInIT: {
    type: String,
    required: true,
    enum: ['yes', 'no'],
  },
}, {
  timestamps: true,
});

const Student = mongoose.model('Student', studentSchema);

export default Student;

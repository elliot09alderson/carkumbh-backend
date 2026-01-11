import Student from '../models/Student.js';

export const registerStudent = async (req, res) => {
  try {
    const { studentName, whatsappNumber, highestQualification, workingInIT } = req.body;
    
    const newStudent = new Student({
      studentName,
      whatsappNumber,
      highestQualification,
      workingInIT,
    });

    await newStudent.save();
    res.status(201).json({ message: 'Student registered successfully', student: newStudent });
  } catch (error) {
    res.status(500).json({ message: 'Failed to register student', error: error.message });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch students', error: error.message });
  }
};

export const getPublicStudents = async (req, res) => {
  try {
    // Only return name and qualification for privacy
    const students = await Student.find().select('studentName highestQualification createdAt').sort({ createdAt: -1 });
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch public students', error: error.message });
  }
};

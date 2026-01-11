import express from 'express';
import { registerStudent, getAllStudents, getPublicStudents } from '../controllers/studentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerStudent);
router.get('/public', getPublicStudents); // Publicly accessible list
router.get('/', protect, getAllStudents);

export default router;

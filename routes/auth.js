import express from 'express';
import { loginAdmin, createAdmin, getAdminProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/setup', createAdmin);
router.get('/profile', protect, getAdminProfile);

export default router;

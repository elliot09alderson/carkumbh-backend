import express from 'express';
import { getBanner, updateBanner } from '../controllers/siteConfigController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/banner', getBanner);
router.post('/banner', protect, upload.single('banner'), updateBanner);

export default router;

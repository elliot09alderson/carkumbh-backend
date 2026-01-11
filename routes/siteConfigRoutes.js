import express from 'express';
import { 
  getBanner, 
  updateBanner, 
  getWorkshopBanner, 
  updateWorkshopBanner,
  getWorkshopContent,
  updateWorkshopContent,
  getEventPackages,
  updateEventPackages
} from '../controllers/siteConfigController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Home banner
router.get('/banner', getBanner);
router.post('/banner', protect, upload.single('banner'), updateBanner);

// Workshop banner
router.get('/workshop-banner', getWorkshopBanner);
router.post('/workshop-banner', protect, upload.single('banner'), updateWorkshopBanner);

// Workshop content
router.get('/workshop-content', getWorkshopContent);
router.post('/workshop-content', protect, updateWorkshopContent);

// Event packages
router.get('/event-packages', getEventPackages);
router.post('/event-packages', protect, updateEventPackages);

export default router;


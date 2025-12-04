import SiteConfig from '../models/SiteConfig.js';
import { uploadToCloudinary } from '../middleware/upload.js';

// @desc    Get banner URL
// @route   GET /api/config/banner
// @access  Public
export const getBanner = async (req, res) => {
  try {
    const config = await SiteConfig.findOne({ key: 'home_banner' });
    if (config) {
      res.json({ bannerUrl: config.value });
    } else {
      res.json({ bannerUrl: null });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update banner image
// @route   POST /api/config/banner
// @access  Private/Admin
export const updateBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload to Cloudinary using helper
    const result = await uploadToCloudinary(req.file, 'carkumbh/banners');

    // Update or create config
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'home_banner' },
      { value: result.secure_url },
      { new: true, upsert: true }
    );

    res.json({ bannerUrl: config.value });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

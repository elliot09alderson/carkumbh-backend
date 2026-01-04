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

// @desc    Get workshop hero banner URL
// @route   GET /api/config/workshop-banner
// @access  Public
export const getWorkshopBanner = async (req, res) => {
  try {
    const config = await SiteConfig.findOne({ key: 'workshop_hero_banner' });
    if (config) {
      res.json({ bannerUrl: config.value });
    } else {
      res.json({ bannerUrl: null });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update workshop hero banner image
// @route   POST /api/config/workshop-banner
// @access  Private/Admin
export const updateWorkshopBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload to Cloudinary using helper
    const result = await uploadToCloudinary(req.file, 'carkumbh/workshop-banners');

    // Update or create config
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'workshop_hero_banner' },
      { value: result.secure_url },
      { new: true, upsert: true }
    );

    res.json({ bannerUrl: config.value });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get workshop content (title, subtitle, prize, etc.)
// @route   GET /api/config/workshop-content
// @access  Public
export const getWorkshopContent = async (req, res) => {
  try {
    const config = await SiteConfig.findOne({ key: 'workshop_content' });
    if (config) {
      res.json(config.value);
    } else {
      // Default content
      res.json({
        title: '7-Day Gen AI & Vibe Coding Workshop',
        subtitle: 'Master the future of coding with AI. Learn, Build, and Win!',
        prizeAmount: '50000',
        isFree: true,
        whatsappGroupLink: 'https://chat.whatsapp.com/Eu63xdXtVaj8sFBCyLDfZa',
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update workshop content
// @route   POST /api/config/workshop-content
// @access  Private/Admin
export const updateWorkshopContent = async (req, res) => {
  try {
    const { title, subtitle, prizeAmount, isFree, whatsappGroupLink } = req.body;

    const config = await SiteConfig.findOneAndUpdate(
      { key: 'workshop_content' },
      { 
        value: {
          title: title || '7-Day Gen AI & Vibe Coding Workshop',
          subtitle: subtitle || 'Master the future of coding with AI. Learn, Build, and Win!',
          prizeAmount: prizeAmount || '50000',
          isFree: isFree !== undefined ? isFree : true,
          whatsappGroupLink: whatsappGroupLink || 'https://chat.whatsapp.com/Eu63xdXtVaj8sFBCyLDfZa',
        }
      },
      { new: true, upsert: true }
    );

    res.json(config.value);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

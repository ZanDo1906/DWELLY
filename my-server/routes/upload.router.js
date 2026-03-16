const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadRoot = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');

const createStorage = (folder, prefix) => multer.diskStorage({
  destination: function (req, file, cb) {
    const targetDir = path.join(uploadRoot, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const avatarUpload = multer({
  storage: createStorage('avatars', 'avatar'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

const conceptUpload = multer({
  storage: createStorage('concepts', 'concept'),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: fileFilter
});

const getSafeFilename = (value) => {
  if (!value) return null;
  const filename = path.basename(value);
  if (!filename || filename.includes('..')) return null;
  return filename;
};

// Upload avatar endpoint
router.post('/upload/avatar', avatarUpload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the file path
    const filePath = `http://localhost:3000/uploads/avatars/${req.file.filename}`;
    res.json({
      message: 'File uploaded successfully',
      filePath: filePath
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload concept image endpoint
router.post('/upload/concept', conceptUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const relativePath = `/uploads/concepts/${req.file.filename}`;
    const filePath = `http://localhost:3000${relativePath}`;

    res.json({
      message: 'Concept image uploaded successfully',
      filePath,
      relativePath
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete concept image file endpoint
router.delete('/upload/concept/:filename', (req, res) => {
  try {
    const filename = getSafeFilename(req.params.filename);
    if (!filename) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    const fullPath = path.join(uploadRoot, 'concepts', filename);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'Concept image not found' });
    }

    fs.unlinkSync(fullPath);
    return res.json({ message: 'Concept image deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const multer = require('multer');
const fs = require('fs');
const path = require('path');

const rootUploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(rootUploadDir)) fs.mkdirSync(rootUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'general';
    if (req.originalUrl.includes('/products')) folder = 'products';
    if (req.originalUrl.includes('/avatars')) folder = 'avatars';

    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext) ? ext : ".bin";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});


const fileFilter = (_, file, cb) => {
  const ok = ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.mimetype);
  cb(ok ? null : new Error("Only image files allowed"), ok);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

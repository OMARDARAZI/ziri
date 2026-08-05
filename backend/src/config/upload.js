const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const allowed = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime'
]);

function imageUpload(folder) {
  return multer({
    storage: multer.diskStorage({
      destination: path.join(__dirname, '..', 'public', 'uploads', folder),
      filename: (_req, file, done) => done(null, `${Date.now()}-${crypto.randomBytes(10).toString('hex')}${path.extname(file.originalname).toLowerCase()}`)
    }),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB for images & videos
    fileFilter: (_req, file, done) => done(null, allowed.has(file.mimetype))
  });
}

module.exports = { imageUpload };

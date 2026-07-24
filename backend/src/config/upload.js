const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('./environment');
const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
function imageUpload(folder) {
  return multer({
    storage: multer.diskStorage({
      destination: path.join(__dirname, '..', 'public', 'uploads', folder),
      filename: (_req, file, done) => done(null, `${Date.now()}-${crypto.randomBytes(10).toString('hex')}${path.extname(file.originalname).toLowerCase()}`)
    }),
    limits: { fileSize: env.maxUploadBytes },
    fileFilter: (_req, file, done) => done(null, allowed.has(file.mimetype))
  });
}
module.exports = { imageUpload };

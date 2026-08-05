const AppError = require('../utils/AppError');

function uploadErrors(error, req, res, next) {
  if (error?.code === 'LIMIT_FILE_SIZE') {
    return next(new AppError('File must be 100 MB or smaller', 422, 'UPLOAD_TOO_LARGE'));
  }
  if (error?.name === 'MulterError') {
    return next(new AppError('File upload failed', 422, 'UPLOAD_ERROR'));
  }
  if (error) {
    return next(error);
  }
  next();
}

module.exports = { uploadErrors };

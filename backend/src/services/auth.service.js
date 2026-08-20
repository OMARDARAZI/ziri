const crypto = require('crypto');
const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');
const users = require('../repositories/user.repository');
const passwordResetRepo = require('../repositories/password-reset.repository');
const { normalizePhone } = require('../utils/phone');
const tokens = require('./token.service');
const db = require('../config/database');

async function register(data) {
  const phone = normalizePhone(data.phone);
  if (!phone) throw new AppError('Phone number is invalid', 422, 'VALIDATION_ERROR');
  if (await users.findByPhone(phone)) throw new AppError('Phone number is already registered', 409, 'PHONE_EXISTS');
  const user = await users.create({ role: 'CUSTOMER', fullName: data.full_name.trim(), phone, passwordHash: await bcrypt.hash(data.password, 12) });
  return { user, tokens: await tokens.issuePair(user) };
}

async function login(phoneInput, password, allowedRoles = ['CUSTOMER']) {
  const phone = normalizePhone(phoneInput);
  const user = phone && await users.findByPhone(phone);
  if (!user || !user.is_active || !allowedRoles.includes(user.role) || !(await bcrypt.compare(password || '', user.password_hash))) {
    throw new AppError('Invalid phone number or password', 401, 'INVALID_CREDENTIALS');
  }
  const publicUser = { id: user.id, role: user.role, full_name: user.full_name, phone: user.phone, is_active: user.is_active };
  return { user: publicUser, tokens: await tokens.issuePair(publicUser) };
}

async function changePassword(userId, currentPassword, newPassword) {
  const current = await users.findById(userId);
  const full = await users.findByPhone(current.phone);
  if (!(await bcrypt.compare(currentPassword, full.password_hash))) {
    throw new AppError('Current password is incorrect', 422, 'INVALID_PASSWORD');
  }
  await db.query('UPDATE users SET password_hash=? WHERE id=?', [await bcrypt.hash(newPassword, 12), userId]);
  await db.query('UPDATE refresh_tokens SET revoked_at=NOW() WHERE user_id=? AND revoked_at IS NULL', [userId]);
}

async function requestPasswordReset(phoneInput) {
  const phone = normalizePhone(phoneInput);
  if (!phone) throw new AppError('Phone number is invalid', 422, 'VALIDATION_ERROR');

  const user = await users.findByPhone(phone);
  if (!user || !user.is_active) {
    throw new AppError('No active account found with this phone number', 404, 'USER_NOT_FOUND');
  }

  // Generate 6-digit OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await passwordResetRepo.createOtp({
    userId: user.id,
    phone,
    otpCode,
    expiresAt
  });

  console.log(`[PASSWORD_RESET] Verification code for ${phone}: ${otpCode}`);

  return {
    phone,
    // In dev / test we can return the code for convenience
    code: process.env.NODE_ENV === 'production' ? undefined : otpCode
  };
}

async function verifyPasswordResetOtp(phoneInput, codeInput) {
  const phone = normalizePhone(phoneInput);
  if (!phone) throw new AppError('Phone number is invalid', 422, 'VALIDATION_ERROR');

  const code = String(codeInput || '').trim();
  if (!code || code.length !== 6) {
    throw new AppError('Please enter a valid 6-digit verification code', 422, 'VALIDATION_ERROR');
  }

  const record = await passwordResetRepo.findValidOtp({ phone, otpCode: code });
  if (!record) {
    throw new AppError('Invalid or expired verification code. Please request a new one.', 400, 'INVALID_OTP');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  await passwordResetRepo.saveResetToken({ id: record.id, resetToken });

  return { resetToken };
}

async function resetPasswordWithToken(phoneInput, resetToken, newPassword) {
  const phone = normalizePhone(phoneInput);
  if (!phone) throw new AppError('Phone number is invalid', 422, 'VALIDATION_ERROR');

  if (!resetToken || typeof resetToken !== 'string') {
    throw new AppError('Reset session is invalid or missing', 400, 'INVALID_RESET_TOKEN');
  }

  if (!newPassword || newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 422, 'VALIDATION_ERROR');
  }

  const record = await passwordResetRepo.findValidResetToken({ phone, resetToken });
  if (!record) {
    throw new AppError('Reset session has expired. Please start over.', 400, 'INVALID_RESET_TOKEN');
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE users SET password_hash=? WHERE id=?', [newHash, record.user_id]);
  await db.query('UPDATE refresh_tokens SET revoked_at=NOW() WHERE user_id=? AND revoked_at IS NULL', [record.user_id]);
  await passwordResetRepo.markUsed(record.id);

  return { success: true };
}

module.exports = {
  register,
  login,
  changePassword,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPasswordWithToken
};


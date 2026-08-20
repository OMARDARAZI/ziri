const db = require('../config/database');

async function createOtp({ userId, phone, otpCode, expiresAt }, executor = db) {
  // Invalidate any previous unused codes for this phone
  await (executor.execute ? executor.execute('UPDATE password_reset_codes SET is_used = 1 WHERE phone = ? AND is_used = 0', [phone]) : executor.query('UPDATE password_reset_codes SET is_used = 1 WHERE phone = ? AND is_used = 0', [phone]));

  const sql = 'INSERT INTO password_reset_codes (user_id, phone, otp_code, expires_at, is_used) VALUES (?, ?, ?, ?, 0)';
  const result = executor.execute 
    ? (await executor.execute(sql, [userId, phone, otpCode, expiresAt]))[0] 
    : await executor.query(sql, [userId, phone, otpCode, expiresAt]);
  
  return result.insertId;
}

async function findValidOtp({ phone, otpCode }, executor = db) {
  const sql = 'SELECT * FROM password_reset_codes WHERE phone = ? AND otp_code = ? AND is_used = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1';
  const rows = executor.execute 
    ? (await executor.execute(sql, [phone, otpCode]))[0] 
    : (await executor.query(sql, [phone, otpCode]))[0];
  return rows[0] || null;
}

async function saveResetToken({ id, resetToken }, executor = db) {
  const sql = 'UPDATE password_reset_codes SET reset_token = ? WHERE id = ?';
  if (executor.execute) {
    await executor.execute(sql, [resetToken, id]);
  } else {
    await executor.query(sql, [resetToken, id]);
  }
}

async function findValidResetToken({ phone, resetToken }, executor = db) {
  const sql = 'SELECT * FROM password_reset_codes WHERE phone = ? AND reset_token = ? AND is_used = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1';
  const rows = executor.execute 
    ? (await executor.execute(sql, [phone, resetToken]))[0] 
    : (await executor.query(sql, [phone, resetToken]))[0];
  return rows[0] || null;
}

async function markUsed(id, executor = db) {
  const sql = 'UPDATE password_reset_codes SET is_used = 1 WHERE id = ?';
  if (executor.execute) {
    await executor.execute(sql, [id]);
  } else {
    await executor.query(sql, [id]);
  }
}

module.exports = {
  createOtp,
  findValidOtp,
  saveResetToken,
  findValidResetToken,
  markUsed
};

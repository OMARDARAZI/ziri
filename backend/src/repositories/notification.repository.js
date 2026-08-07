const db = require('../config/database');
const userRepo = require('./user.repository');

async function createNotification({ userId, title, body, type = 'SYSTEM', referenceId = null }) {
  const user = await userRepo.findById(userId);
  if (!user || !user.notifications_enabled) {
    console.log(`[Notification] Suppressed for user ${userId} (notifications_enabled = false or user missing).`);
    return null;
  }

  const sql = `
    INSERT INTO notifications (user_id, title, body, type, reference_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  const result = await db.query(sql, [userId, title, body, type, referenceId]);
  const insertId = result.insertId || result[0]?.insertId;
  
  return {
    id: insertId,
    user_id: userId,
    title,
    body,
    type,
    reference_id: referenceId,
    is_read: false,
    created_at: new Date()
  };
}

async function listUserNotifications(userId, page = 1, limit = 20) {
  const offset = (Math.max(1, page) - 1) * limit;
  const sql = `
    SELECT id, user_id, title, body, type, reference_id, is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const rows = (await db.query(sql, [userId, limit, offset])) || [];

  const countSql = `SELECT COUNT(*) as total FROM notifications WHERE user_id = ?`;
  const countRows = (await db.query(countSql, [userId])) || [];
  const total = countRows[0]?.total || 0;

  return {
    items: rows,
    pagination: {
      page: Math.max(1, page),
      limit,
      total,
      pages: Math.ceil(total / limit) || 1
    }
  };
}

async function getUnreadCount(userId) {
  const sql = `SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0`;
  const rows = (await db.query(sql, [userId])) || [];
  return rows[0]?.unread_count || 0;
}

async function markAsRead(id, userId) {
  const sql = `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`;
  await db.query(sql, [id, userId]);
  return true;
}

async function markAllAsRead(userId) {
  const sql = `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`;
  await db.query(sql, [userId]);
  return true;
}

module.exports = {
  createNotification,
  listUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};

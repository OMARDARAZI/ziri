const db = require('../config/database');
const { limitOffsetClause } = require('../utils/pagination');

async function createMessage({ userId = null, name, email = null, phone = null, subject, message }) {
  const sql = `
    INSERT INTO support_messages (user_id, name, email, phone, subject, message, status)
    VALUES (?, ?, ?, ?, ?, ?, 'NEW')
  `;
  const result = await db.query(sql, [userId, name, email, phone, subject, message]);
  const insertId = result.insertId || result[0]?.insertId;
  return {
    id: insertId,
    user_id: userId,
    name,
    email,
    phone,
    subject,
    message,
    status: 'NEW',
    created_at: new Date()
  };
}

async function listMessages({ status, page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (safePage - 1) * safeLimit;

  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT id, user_id, name, email, phone, subject, message, status, created_at, updated_at
    FROM support_messages
    ${whereSql}
    ORDER BY created_at DESC
    ${limitOffsetClause(safeLimit, offset)}
  `;

  const rows = (await db.query(sql, params)) || [];
  const countSql = `SELECT COUNT(*) as total FROM support_messages ${whereSql}`;
  const countRows = (await db.query(countSql, params)) || [];
  const total = countRows[0]?.total || 0;

  return {
    items: rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit) || 1
    }
  };
}

module.exports = {
  createMessage,
  listMessages
};

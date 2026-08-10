const db = require('../config/database');
const { limitOffsetClause } = require('../utils/pagination');

async function createRequest({ userId = null, phone, fullName = null, reason = null }) {
  const sql = `
    INSERT INTO account_deletion_requests (user_id, phone, full_name, reason, status)
    VALUES (?, ?, ?, ?, 'PENDING')
  `;
  const result = await db.query(sql, [userId, phone, fullName, reason]);
  const insertId = result.insertId || result[0]?.insertId;
  return {
    id: insertId,
    user_id: userId,
    phone,
    full_name: fullName,
    reason,
    status: 'PENDING',
    created_at: new Date()
  };
}

async function listRequests({ status, page = 1, limit = 20 } = {}) {
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
    SELECT id, user_id, phone, full_name, reason, status, processed_at, created_at, updated_at
    FROM account_deletion_requests
    ${whereSql}
    ORDER BY created_at DESC
    ${limitOffsetClause(safeLimit, offset)}
  `;

  const rows = (await db.query(sql, params)) || [];
  const countSql = `SELECT COUNT(*) as total FROM account_deletion_requests ${whereSql}`;
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

async function updateStatus(id, status) {
  const processedAt = status === 'PROCESSED' ? new Date() : null;
  const sql = `
    UPDATE account_deletion_requests
    SET status = ?, processed_at = ?
    WHERE id = ?
  `;
  await db.query(sql, [status, processedAt, id]);
  return true;
}

module.exports = {
  createRequest,
  listRequests,
  updateStatus
};

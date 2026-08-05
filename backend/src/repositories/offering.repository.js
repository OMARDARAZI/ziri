const db = require('../config/database'); const { getPagination, limitOffsetClause, metadata } = require('../utils/pagination');
const select = `o.*, p.business_name AS provider_name, p.logo AS provider_logo, p.phone AS provider_phone, p.is_active AS provider_is_active`;
async function list(query = {}, activeOnly = true) {
  const { page, limit, offset } = getPagination(query);
  const clauses = [];
  const params = [];
  if (activeOnly) clauses.push('o.is_active=1 AND p.is_active=1');
  if (query.type) {
    clauses.push('o.type=?');
    params.push(query.type);
  }
  if (query.provider_id) {
    clauses.push('o.provider_id=?');
    params.push(query.provider_id);
  }
  if (query.search && String(query.search).trim() !== '') {
    clauses.push('(o.title LIKE ? OR p.business_name LIKE ? OR o.description LIKE ?)');
    const term = `%${String(query.search).trim()}%`;
    params.push(term, term, term);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `FROM offerings o JOIN providers p ON p.id=o.provider_id ${where}`;
  const [items, count] = await Promise.all([
    db.query(`SELECT ${select} ${sql} ORDER BY o.created_at DESC ${limitOffsetClause(limit, offset)}`, params),
    db.query(`SELECT COUNT(*) AS total ${sql}`, params)
  ]);
  return { items, pagination: metadata(page, limit, count[0].total) };
}
async function find(id, executor = db, lock = false) { const sql = `SELECT ${select} FROM offerings o JOIN providers p ON p.id=o.provider_id WHERE o.id=?${lock ? ' FOR UPDATE' : ''}`; const rows = executor.execute ? (await executor.execute(sql, [id]))[0] : await executor.query(sql, [id]); return rows[0] || null; }
module.exports = { list, find };

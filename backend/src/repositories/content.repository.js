const db = require('../config/database'); const { getPagination, limitOffsetClause, metadata } = require('../utils/pagination');
const resources = {
  stories: { table: 'stories', order: 'display_order ASC, story_time DESC' }, news: { table: 'news_articles', order: 'published_at DESC' },
  events: { table: 'events', order: 'event_date ASC, start_time ASC' }, safetyTips: { table: 'safety_tips', order: 'display_order ASC, created_at DESC' }, weather: { table: 'weather_updates', order: 'weather_date DESC' }
};
async function list(name, query = {}, activeOnly = true) { const source = resources[name]; if (!source) throw new Error('Unknown content resource'); const { page, limit, offset } = getPagination(query); const where = activeOnly ? 'WHERE is_active = 1' : ''; const [items, totals] = await Promise.all([db.query(`SELECT * FROM ${source.table} ${where} ORDER BY ${source.order} ${limitOffsetClause(limit, offset)}`), db.query(`SELECT COUNT(*) AS total FROM ${source.table} ${where}`)]); return { items, pagination: metadata(page, limit, totals[0].total) }; }
async function find(name, id) { const source = resources[name]; const rows = await db.query(`SELECT * FROM ${source.table} WHERE id = ?`, [id]); return rows[0] || null; }
module.exports = { list, find, resources };

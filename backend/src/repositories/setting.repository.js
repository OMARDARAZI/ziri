const db = require('../config/database');
async function all() { const rows = await db.query('SELECT setting_key, setting_value FROM app_settings'); return Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value])); }
async function get(key) { const rows = await db.query('SELECT setting_value FROM app_settings WHERE setting_key=?',[key]); return rows[0]?.setting_value || null; }
module.exports = { all, get };

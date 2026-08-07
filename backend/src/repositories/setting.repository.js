const db = require('../config/database');
async function all() { const rows = await db.query('SELECT setting_key, setting_value FROM app_settings'); return Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value])); }
async function get(key) { const rows = await db.query('SELECT setting_value FROM app_settings WHERE setting_key=?',[key]); return rows[0]?.setting_value || null; }
async function set(key, value) { await db.query('INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)', [key, value]); }
module.exports = { all, get, set };


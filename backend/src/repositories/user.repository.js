const db = require('../config/database');
const fields = 'id, role, full_name, phone, avatar_url, is_active, created_at, updated_at';
async function findByPhone(phone, executor = db) { const rows = await executor.query?.('SELECT * FROM users WHERE phone = ?', [phone]) || (await executor.execute('SELECT * FROM users WHERE phone = ?', [phone]))[0]; return rows[0] || null; }
async function findById(id, executor = db) { const rows = await executor.query?.(`SELECT ${fields} FROM users WHERE id = ?`, [id]) || (await executor.execute(`SELECT ${fields} FROM users WHERE id = ?`, [id]))[0]; return rows[0] || null; }
async function create(data, executor = db) { const sql = 'INSERT INTO users (role, full_name, phone, avatar_url, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?)'; const result = executor.execute ? (await executor.execute(sql, [data.role, data.fullName, data.phone, data.avatarUrl ?? null, data.passwordHash, data.isActive ?? true]))[0] : await executor.query(sql, [data.role, data.fullName, data.phone, data.avatarUrl ?? null, data.passwordHash, data.isActive ?? true]); return findById(result.insertId, executor); }
async function updateProfile(id, data) { await db.query('UPDATE users SET full_name = ?, phone = ?, avatar_url = ? WHERE id = ?', [data.fullName, data.phone, data.avatarUrl ?? null, id]); return findById(id); }
async function deactivate(id) { await db.query('UPDATE users SET is_active = 0 WHERE id = ?', [id]); return findById(id); }
module.exports = { findByPhone, findById, create, updateProfile, deactivate };

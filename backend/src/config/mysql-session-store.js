const session = require('express-session');

class MySQLSessionStore extends session.Store {
  constructor(pool) { super(); this.pool = pool; this.ready = this.initialize(); }
  async initialize() { await this.pool.execute(`CREATE TABLE IF NOT EXISTS sessions (session_id VARCHAR(128) PRIMARY KEY, expires_at BIGINT NOT NULL, data MEDIUMTEXT NOT NULL, KEY idx_sessions_expires (expires_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`); }
  async get(sid, callback) { try { await this.ready; const [rows] = await this.pool.execute('SELECT data FROM sessions WHERE session_id=? AND expires_at>?', [sid, Date.now()]); callback(null, rows[0] ? JSON.parse(rows[0].data) : null); } catch (error) { callback(error); } }
  async set(sid, value, callback = () => {}) { try { await this.ready; const expires = value.cookie?.expires ? new Date(value.cookie.expires).getTime() : Date.now() + 8 * 60 * 60 * 1000; await this.pool.execute('INSERT INTO sessions (session_id,expires_at,data) VALUES (?,?,?) ON DUPLICATE KEY UPDATE expires_at=VALUES(expires_at),data=VALUES(data)', [sid, expires, JSON.stringify(value)]); callback(null); } catch (error) { callback(error); } }
  async destroy(sid, callback = () => {}) { try { await this.ready; await this.pool.execute('DELETE FROM sessions WHERE session_id=?',[sid]); callback(null); } catch (error) { callback(error); } }
  async touch(sid, value, callback = () => {}) { try { await this.ready; const expires = value.cookie?.expires ? new Date(value.cookie.expires).getTime() : Date.now() + 8 * 60 * 60 * 1000; await this.pool.execute('UPDATE sessions SET expires_at=? WHERE session_id=?',[expires,sid]); callback(null); } catch (error) { callback(error); } }
}
module.exports = MySQLSessionStore;

const session = require('express-session');
const env = require('./environment');
const { pool } = require('./database');
const MySQLSessionStore = require('./mysql-session-store');

module.exports = session({
  key: 'zeere.sid', secret: env.sessionSecret, resave: false, saveUninitialized: false,
  store: new MySQLSessionStore(pool),
  cookie: { httpOnly: true, sameSite: 'lax', secure: env.nodeEnv === 'production', maxAge: 1000 * 60 * 60 * 8 }
});

const app = require('./app');
const { pool } = require('./config/database');
const env = require('./config/environment');
const { initializeDatabase } = require('../database/migrate');

async function start() {
  await initializeDatabase();
  await pool.query('SELECT 1');
  app.listen(env.port, () => console.log(`Zeere listening on http://localhost:${env.port}`));
}

start().catch((error) => {
  console.error('Unable to start Zeere:', error.message);
  process.exit(1);
});


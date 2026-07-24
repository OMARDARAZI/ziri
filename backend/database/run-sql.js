const fs = require('fs'); const path = require('path'); const mysql = require('mysql2/promise'); const env = require('../src/config/environment');
async function main() {
  const action = process.argv[2]; const connection = await mysql.createConnection({ ...env.db, multipleStatements: true });
  try { if (action === 'schema') await connection.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    else if (action === 'reset') { await connection.query(`DROP DATABASE IF EXISTS \`${env.db.database}\``); await connection.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')); }
    else throw new Error('Use schema or reset'); console.log(`Database ${action} completed.`); }
  finally { await connection.end(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });

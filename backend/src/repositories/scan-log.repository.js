const db = require('../config/database');
async function create(data, executor = db) { const sql = 'INSERT INTO qr_scan_logs (qr_id,scanned_by_user_id,provided_token,success,result_code,result_message,ip_address,user_agent) VALUES (?,?,?,?,?,?,?,?)'; const values = [data.qrId || null,data.userId,data.token,data.success,data.code,data.message,data.ip || null,data.userAgent || null]; return executor.execute ? (await executor.execute(sql,values))[0] : await executor.query(sql,values); }
module.exports = { create };

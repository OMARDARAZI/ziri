function mysqlDate(date = new Date()) { return new Date(date).toISOString().slice(0, 19).replace('T', ' '); }
function validityWindow(scheduledAt, beforeMinutes, afterMinutes) { const at = new Date(scheduledAt); return { validFrom: mysqlDate(new Date(at.getTime() - beforeMinutes * 60000)), validUntil: mysqlDate(new Date(at.getTime() + afterMinutes * 60000)) }; }
module.exports = { mysqlDate, validityWindow };

function normalizePhone(phone) { const clean = String(phone || '').trim(); if (clean.includes('@')) return clean.toLowerCase(); const cleanPhone = clean.replace(/[\s().-]/g, ''); if (!/^\+?[1-9]\d{6,14}$/.test(cleanPhone)) return null; return cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`; }
function maskPhone(phone) { const value = String(phone || ''); return value.length <= 4 ? '••••' : `${'•'.repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`; }
module.exports = { normalizePhone, maskPhone };

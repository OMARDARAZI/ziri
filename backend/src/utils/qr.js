const env = require('../config/environment');
const publicUrl = (token) => `${env.publicAppUrl}/qr/${token}`;
function extractToken(value) { const raw = String(value || '').trim(); if (!raw) return ''; try { const url = new URL(raw); const match = url.pathname.match(/^\/qr\/([a-f0-9]{32,128})/i); return match ? match[1] : ''; } catch { const match = raw.match(/^([a-f0-9]{32,128})$/i); return match ? match[1] : ''; } }
module.exports = { publicUrl, extractToken };

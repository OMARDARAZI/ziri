const settings = require('../repositories/setting.repository'); const env = require('../config/environment');
async function qrValiditySettings() { const all = await settings.all(); return { before: Number(all.qr_valid_before_minutes ?? env.qrValidBeforeMinutes), after: Number(all.qr_valid_after_minutes ?? env.qrValidAfterMinutes) }; }
module.exports = { qrValiditySettings };

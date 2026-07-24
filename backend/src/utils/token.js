const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/environment');
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
function signAccess(user) { return jwt.sign({ sub: user.id, role: user.role, phone: user.phone }, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn }); }
function signRefresh(user, jti) { return jwt.sign({ sub: user.id, jti }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn }); }
module.exports = { sha256, randomToken, signAccess, signRefresh };

require('dotenv').config();

const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET'];
if (process.env.NODE_ENV === 'production') {
  for (const key of required) if (!process.env[key]) throw new Error(`${key} is required in production`);
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  db: {
    host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'zeere', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || ''
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'development-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret-change-me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m', refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  sessionSecret: process.env.SESSION_SECRET || 'development-session-secret-change-me',
  publicAppUrl: (process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, ''),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',').map((value) => value.trim()).filter(Boolean),
  qrValidBeforeMinutes: Number(process.env.QR_VALID_BEFORE_MINUTES || 60),
  qrValidAfterMinutes: Number(process.env.QR_VALID_AFTER_MINUTES || 180),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_SIZE_MB || 5) * 1024 * 1024,
  oneSignal: {
    appId: process.env.ONESIGNAL_APP_ID || '',
    restApiKey: process.env.ONESIGNAL_REST_API_KEY || ''
  }
};

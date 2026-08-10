const env = require('../config/environment');

/**
 * Send push notification via OneSignal REST API v1
 * @param {Object} options
 * @param {number|string} options.userId - Target user ID (External ID)
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification content
 * @param {Object} [options.data] - Custom payload data
 */
async function sendPushNotification({ userId, title, body, data = {} }) {
  const appId = env.oneSignal.appId;
  const restApiKey = env.oneSignal.restApiKey;

  if (!appId || !restApiKey) {
    console.log(`[OneSignal] Skipped push notification for user ${userId} (ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY missing).`);
    return null;
  }

  const payload = {
    app_id: appId,
    include_aliases: {
      external_id: [String(userId)]
    },
    target_channel: 'push',
    headings: { en: title },
    contents: { en: body },
    data
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Basic ${restApiKey}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('[OneSignal Error]', result);
    } else {
      console.log(`[OneSignal Push Delivered] User ${userId}: ${title}`);
    }
    return result;
  } catch (error) {
    console.error('[OneSignal Network Error]', error.message);
    return null;
  }
}

module.exports = {
  sendPushNotification
};

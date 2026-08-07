const notificationRepo = require('../../repositories/notification.repository');
const { success } = require('../../utils/apiResponse');

async function list(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const userId = req.user.id;

  const result = await notificationRepo.listUserNotifications(userId, page, limit);
  const unreadCount = await notificationRepo.getUnreadCount(userId);

  success(res, {
    notifications: result.items,
    unread_count: unreadCount,
    pagination: result.pagination
  }, 'Notifications fetched successfully');
}

async function getUnreadCount(req, res) {
  const userId = req.user.id;
  const unreadCount = await notificationRepo.getUnreadCount(userId);
  success(res, { unread_count: unreadCount });
}

async function markRead(req, res) {
  const notificationId = parseInt(req.params.id);
  const userId = req.user.id;

  await notificationRepo.markAsRead(notificationId, userId);
  const unreadCount = await notificationRepo.getUnreadCount(userId);

  success(res, { unread_count: unreadCount }, 'Notification marked as read');
}

async function markAllRead(req, res) {
  const userId = req.user.id;

  await notificationRepo.markAllAsRead(userId);
  success(res, { unread_count: 0 }, 'All notifications marked as read');
}

module.exports = {
  list,
  getUnreadCount,
  markRead,
  markAllRead
};

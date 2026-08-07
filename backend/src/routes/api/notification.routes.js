const router = require('express').Router();
const c = require('../../controllers/api/notification.controller');
const { authenticateApi } = require('../../middleware/api-auth.middleware');
const asyncHandler = require('../../utils/asyncHandler');

router.use(authenticateApi);

router.get('/', asyncHandler(c.list));
router.get('/unread-count', asyncHandler(c.getUnreadCount));
router.patch('/:id/read', asyncHandler(c.markRead));
router.patch('/read-all', asyncHandler(c.markAllRead));

module.exports = router;

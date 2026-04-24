const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');

router.get('/:userId', async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.params.userId);
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:userId/unread-count', async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.params.userId);
    res.json({ success: true, data: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    const notification = await notificationService.createNotification(userId, title, message, type);
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:notificationId/read', async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.notificationId);
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:userId/read-all', async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.params.userId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:notificationId', async (req, res) => {
  try {
    await notificationService.deleteNotification(req.params.notificationId);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

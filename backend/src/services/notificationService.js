const { pool } = require('../db');

async function createNotification(userId, title, message, type = 'info') {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
     VALUES ($1, $2, $3, $4, false, NOW())
     RETURNING *;`,
    [userId, title, message, type]
  );
  return result.rows[0];
}

async function getUserNotifications(userId) {
  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50;`,
    [userId]
  );
  return result.rows;
}

async function markAsRead(notificationId) {
  const result = await pool.query(
    `UPDATE notifications
     SET is_read = true
     WHERE notification_id = $1
     RETURNING *;`,
    [notificationId]
  );
  return result.rows[0];
}

async function markAllAsRead(userId) {
  await pool.query(
    `UPDATE notifications SET is_read = true WHERE user_id = $1;`,
    [userId]
  );
  return { success: true };
}

async function getUnreadCount(userId) {
  const result = await pool.query(
    `SELECT COUNT(*) as unread_count
     FROM notifications
     WHERE user_id = $1 AND is_read = false;`,
    [userId]
  );
  return result.rows[0];
}

async function deleteNotification(notificationId) {
  await pool.query(
    `DELETE FROM notifications WHERE notification_id = $1;`,
    [notificationId]
  );
  return { success: true };
}

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification
};

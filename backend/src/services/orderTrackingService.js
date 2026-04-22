const pool = require('../db/connection');

async function getOrderStatus(orderId) {
  const result = await pool.query(
    `SELECT o.order_id, o.status, o.created_at, o.updated_at,
            o.total_amount, o.delivery_address,
            json_agg(json_build_object(
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price
            )) as items
     FROM orders o
     JOIN order_items oi ON o.order_id = oi.order_id
     WHERE o.order_id = $1
     GROUP BY o.order_id;`,
    [orderId]
  );
  return result.rows[0];
}

async function updateOrderStatus(orderId, status) {
  const result = await pool.query(
    `UPDATE orders
     SET status = $1, updated_at = NOW()
     WHERE order_id = $2
     RETURNING *;`,
    [status, orderId]
  );
  return result.rows[0];
}

async function getUserOrders(userId) {
  const result = await pool.query(
    `SELECT o.order_id, o.status, o.total_amount,
            o.created_at, o.updated_at,
            COUNT(oi.order_item_id) as item_count
     FROM orders o
     JOIN order_items oi ON o.order_id = oi.order_id
     WHERE o.user_id = $1
     GROUP BY o.order_id
     ORDER BY o.created_at DESC;`,
    [userId]
  );
  return result.rows;
}

async function getOrderHistory(userId) {
  const result = await pool.query(
    `SELECT o.order_id, o.status, o.total_amount, o.created_at,
            oi.product_name, oi.quantity, oi.unit_price
     FROM orders o
     JOIN order_items oi ON o.order_id = oi.order_id
     WHERE o.user_id = $1
     AND o.status IN ('delivered', 'cancelled')
     ORDER BY o.created_at DESC;`,
    [userId]
  );
  return result.rows;
}

async function cancelOrder(orderId, userId) {
  const result = await pool.query(
    `UPDATE orders
     SET status = 'cancelled', updated_at = NOW()
     WHERE order_id = $1
     AND user_id = $2
     AND status IN ('pending', 'processing')
     RETURNING *;`,
    [orderId, userId]
  );
  if (!result.rows[0]) throw new Error('Order cannot be cancelled');
  return result.rows[0];
}

module.exports = {
  getOrderStatus,
  updateOrderStatus,
  getUserOrders,
  getOrderHistory,
  cancelOrder
};

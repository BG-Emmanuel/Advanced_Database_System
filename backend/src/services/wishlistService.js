const pool = require('../db/connection');

async function addToWishlist(userId, productId) {
  const result = await pool.query(
    `INSERT INTO wishlists (user_id, product_id, created_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, product_id) DO NOTHING
     RETURNING *;`,
    [userId, productId]
  );
  return result.rows[0];
}

async function removeFromWishlist(userId, productId) {
  const result = await pool.query(
    `DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2 RETURNING *;`,
    [userId, productId]
  );
  return result.rows[0];
}

async function getUserWishlist(userId) {
  const result = await pool.query(
    `SELECT w.*, p.product_name, p.base_price, p.discount_price, p.rating
     FROM wishlists w
     JOIN products p ON w.product_id = p.product_id
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC;`,
    [userId]
  );
  return result.rows;
}

module.exports = { addToWishlist, removeFromWishlist, getUserWishlist };

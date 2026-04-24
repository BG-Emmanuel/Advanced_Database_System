const { pool } = require('../db');

async function addReview(userId, productId, rating, comment) {
  const result = await pool.query(
    `INSERT INTO product_reviews (user_id, product_id, rating, comment, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *;`,
    [userId, productId, rating, comment]
  );
  await pool.query(
    `UPDATE products
     SET rating = (
       SELECT AVG(rating) FROM product_reviews WHERE product_id = $1
     ),
     review_count = (
       SELECT COUNT(*) FROM product_reviews WHERE product_id = $1
     ),
     updated_at = NOW()
     WHERE product_id = $1;`,
    [productId]
  );
  return result.rows[0];
}

async function getProductReviews(productId) {
  const result = await pool.query(
    `SELECT pr.*, u.full_name, u.profile_image
     FROM product_reviews pr
     JOIN users u ON pr.user_id = u.user_id
     WHERE pr.product_id = $1
     ORDER BY pr.created_at DESC;`,
    [productId]
  );
  return result.rows;
}

async function getUserReviews(userId) {
  const result = await pool.query(
    `SELECT pr.*, p.product_name
     FROM product_reviews pr
     JOIN products p ON pr.product_id = p.product_id
     WHERE pr.user_id = $1
     ORDER BY pr.created_at DESC;`,
    [userId]
  );
  return result.rows;
}

async function deleteReview(reviewId, userId) {
  const result = await pool.query(
    `DELETE FROM product_reviews
     WHERE review_id = $1 AND user_id = $2
     RETURNING *;`,
    [reviewId, userId]
  );
  return result.rows[0];
}

async function getProductRatingSummary(productId) {
  const result = await pool.query(
    `SELECT
       COUNT(*) as total_reviews,
       AVG(rating) as average_rating,
       COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
       COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
       COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
       COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
       COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
     FROM product_reviews
     WHERE product_id = $1;`,
    [productId]
  );
  return result.rows[0];
}

module.exports = {
  addReview,
  getProductReviews,
  getUserReviews,
  deleteReview,
  getProductRatingSummary
};

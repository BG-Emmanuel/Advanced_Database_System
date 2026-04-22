const pool = require('../db/connection');

async function createCoupon(code, discountPercent, maxUses, expiresAt) {
  const result = await pool.query(
    `INSERT INTO coupons (code, discount_percent, max_uses, uses_count, expires_at, created_at)
     VALUES ($1, $2, $3, 0, $4, NOW())
     RETURNING *;`,
    [code, discountPercent, maxUses, expiresAt]
  );
  return result.rows[0];
}

async function validateCoupon(code) {
  const result = await pool.query(
    `SELECT * FROM coupons
     WHERE code = $1
     AND is_active = true
     AND expires_at > NOW()
     AND uses_count < max_uses;`,
    [code]
  );
  return result.rows[0] || null;
}

async function applyCoupon(code) {
  const coupon = await validateCoupon(code);
  if (!coupon) throw new Error('Invalid or expired coupon');
  await pool.query(
    `UPDATE coupons SET uses_count = uses_count + 1 WHERE code = $1;`,
    [code]
  );
  return coupon;
}

async function getAllCoupons() {
  const result = await pool.query(
    `SELECT * FROM coupons ORDER BY created_at DESC;`
  );
  return result.rows;
}

module.exports = { createCoupon, validateCoupon, applyCoupon, getAllCoupons };

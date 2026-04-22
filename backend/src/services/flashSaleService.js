const pool = require('../db/connection');

async function createFlashSale(productId, salePrice, startTime, endTime, maxQuantity) {
  const result = await pool.query(
    `INSERT INTO flash_sales (product_id, sale_price, start_time, end_time, max_quantity, sold_count, is_active, created_at)
     VALUES ($1, $2, $3, $4, $5, 0, true, NOW())
     RETURNING *;`,
    [productId, salePrice, startTime, endTime, maxQuantity]
  );
  return result.rows[0];
}

async function getActiveFlashSales() {
  const result = await pool.query(
    `SELECT fs.*, p.product_name, p.base_price,
            p.rating, p.review_count,
            v.shop_name,
            EXTRACT(EPOCH FROM (fs.end_time - NOW())) as seconds_remaining
     FROM flash_sales fs
     JOIN products p ON fs.product_id = p.product_id
     JOIN vendor_profiles v ON p.vendor_id = v.vendor_id
     WHERE fs.is_active = true
     AND fs.start_time <= NOW()
     AND fs.end_time >= NOW()
     AND fs.sold_count < fs.max_quantity
     ORDER BY fs.end_time ASC;`
  );
  return result.rows;
}

async function getUpcomingFlashSales() {
  const result = await pool.query(
    `SELECT fs.*, p.product_name, p.base_price,
            p.rating, v.shop_name,
            EXTRACT(EPOCH FROM (fs.start_time - NOW())) as seconds_until_start
     FROM flash_sales fs
     JOIN products p ON fs.product_id = p.product_id
     JOIN vendor_profiles v ON p.vendor_id = v.vendor_id
     WHERE fs.is_active = true
     AND fs.start_time > NOW()
     ORDER BY fs.start_time ASC;`
  );
  return result.rows;
}

async function purchaseFlashSaleItem(flashSaleId, quantity) {
  const result = await pool.query(
    `UPDATE flash_sales
     SET sold_count = sold_count + $1
     WHERE flash_sale_id = $2
     AND is_active = true
     AND end_time >= NOW()
     AND (max_quantity - sold_count) >= $1
     RETURNING *;`,
    [quantity, flashSaleId]
  );
  if (!result.rows[0]) throw new Error('Flash sale not available or insufficient stock');
  return result.rows[0];
}

async function endFlashSale(flashSaleId) {
  const result = await pool.query(
    `UPDATE flash_sales
     SET is_active = false
     WHERE flash_sale_id = $1
     RETURNING *;`,
    [flashSaleId]
  );
  return result.rows[0];
}

module.exports = {
  createFlashSale,
  getActiveFlashSales,
  getUpcomingFlashSales,
  purchaseFlashSaleItem,
  endFlashSale
};

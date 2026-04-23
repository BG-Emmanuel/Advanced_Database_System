const { pool } = require('../db');

async function getInventory(vendorId) {
  const result = await pool.query(
    `SELECT p.product_id, p.product_name, p.stock_quantity,
            p.is_available, p.base_price, p.discount_price,
            c.name as category_name
     FROM products p
     JOIN categories c ON p.category_id = c.category_id
     WHERE p.vendor_id = $1
     ORDER BY p.stock_quantity ASC;`,
    [vendorId]
  );
  return result.rows;
}

async function updateStock(productId, quantity) {
  const result = await pool.query(
    `UPDATE products
     SET stock_quantity = $1,
         is_available = CASE WHEN $1 > 0 THEN true ELSE false END,
         updated_at = NOW()
     WHERE product_id = $2
     RETURNING *;`,
    [quantity, productId]
  );
  return result.rows[0];
}

async function getLowStockProducts(vendorId, threshold = 5) {
  const result = await pool.query(
    `SELECT p.product_id, p.product_name, p.stock_quantity,
            p.base_price, c.name as category_name
     FROM products p
     JOIN categories c ON p.category_id = c.category_id
     WHERE p.vendor_id = $1
     AND p.stock_quantity <= $2
     ORDER BY p.stock_quantity ASC;`,
    [vendorId, threshold]
  );
  return result.rows;
}

async function getOutOfStockProducts(vendorId) {
  const result = await pool.query(
    `SELECT p.product_id, p.product_name, p.base_price,
            c.name as category_name
     FROM products p
     JOIN categories c ON p.category_id = c.category_id
     WHERE p.vendor_id = $1
     AND p.stock_quantity = 0
     ORDER BY p.product_name ASC;`,
    [vendorId]
  );
  return result.rows;
}

async function restockProduct(productId, addQuantity) {
  const result = await pool.query(
    `UPDATE products
     SET stock_quantity = stock_quantity + $1,
         is_available = true,
         updated_at = NOW()
     WHERE product_id = $2
     RETURNING *;`,
    [addQuantity, productId]
  );
  return result.rows[0];
}

module.exports = {
  getInventory,
  updateStock,
  getLowStockProducts,
  getOutOfStockProducts,
  restockProduct
};

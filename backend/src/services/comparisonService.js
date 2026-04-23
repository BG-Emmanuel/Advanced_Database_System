const { pool } = require('../db');

async function compareProducts(productIds) {
  const result = await pool.query(
    `SELECT p.product_id, p.product_name, p.base_price,
            p.discount_price, p.rating, p.review_count,
            p.stock_quantity, p.description,
            c.name as category_name,
            v.shop_name as vendor_name,
            json_agg(json_build_object(
              'spec_name', ps.spec_name,
              'spec_value', ps.spec_value
            )) as specifications
     FROM products p
     JOIN categories c ON p.category_id = c.category_id
     JOIN vendor_profiles v ON p.vendor_id = v.vendor_id
     LEFT JOIN product_specifications ps ON p.product_id = ps.product_id
     WHERE p.product_id = ANY($1)
     GROUP BY p.product_id, c.name, v.shop_name
     ORDER BY p.rating DESC;`,
    [productIds]
  );
  return result.rows;
}

async function getComparisonSummary(productIds) {
  const products = await compareProducts(productIds);
  if (!products.length) throw new Error('No products found');

  const summary = {
    cheapest: products.reduce((a, b) =>
      (a.discount_price || a.base_price) < (b.discount_price || b.base_price) ? a : b
    ),
    highest_rated: products.reduce((a, b) =>
      a.rating > b.rating ? a : b
    ),
    most_reviewed: products.reduce((a, b) =>
      a.review_count > b.review_count ? a : b
    ),
    best_in_stock: products.reduce((a, b) =>
      a.stock_quantity > b.stock_quantity ? a : b
    ),
    products: products
  };
  return summary;
}

async function getSimilarProductsForComparison(productId, limit = 4) {
  const result = await pool.query(
    `SELECT p.product_id, p.product_name, p.base_price,
            p.discount_price, p.rating, p.review_count
     FROM products p
     WHERE p.category_id = (
       SELECT category_id FROM products WHERE product_id = $1
     )
     AND p.product_id != $1
     AND p.is_available = true
     ORDER BY p.rating DESC
     LIMIT $2;`,
    [productId, limit]
  );
  return result.rows;
}

module.exports = {
  compareProducts,
  getComparisonSummary,
  getSimilarProductsForComparison
};

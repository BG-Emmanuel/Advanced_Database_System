const { v4: uuid } = require('uuid');
const db = require('../db');

// POST /api/vendors/register
exports.registerVendor = async (req, res) => {
  try {
    const { shop_name, shop_description, city, address, phone, whatsapp } = req.body;
    const existing = await db.query('SELECT vendor_id FROM vendor_profiles WHERE user_id=$1',[req.user.user_id]);
    if (existing.rows.length) return res.status(409).json({ success:false, message:'Vendor profile already exists' });
    const nameCheck = await db.query('SELECT vendor_id FROM vendor_profiles WHERE shop_name=$1',[shop_name]);
    if (nameCheck.rows.length) return res.status(409).json({ success:false, message:'Shop name already taken' });

    const { rows } = await db.query(
      `INSERT INTO vendor_profiles (vendor_id,user_id,shop_name,shop_description,city,address,phone,whatsapp)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [uuid(),req.user.user_id,shop_name,shop_description,city,address,phone,whatsapp]
    );
    await db.query("UPDATE users SET role='vendor' WHERE user_id=$1",[req.user.user_id]);
    return res.status(201).json({ success:true, vendor:rows[0] });
  } catch (e) {
    console.error('registerVendor:', e);
    return res.status(500).json({ success:false, message:'Failed to create vendor profile' });
  }
};

// GET /api/vendors/profile
exports.getVendorProfile = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM vendor_profiles WHERE user_id=$1',[req.user.user_id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Vendor profile not found' });
    return res.json({ success:true, vendor:rows[0] });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to fetch vendor profile' });
  }
};

// PUT /api/vendors/profile
exports.updateVendorProfile = async (req, res) => {
  try {
    const { shop_name, shop_description, city, address, phone, whatsapp } = req.body;
    const { rows } = await db.query(
      `UPDATE vendor_profiles SET
         shop_name=COALESCE($1,shop_name), shop_description=COALESCE($2,shop_description),
         city=COALESCE($3,city), address=COALESCE($4,address),
         phone=COALESCE($5,phone), whatsapp=COALESCE($6,whatsapp), updated_at=NOW()
       WHERE user_id=$7 RETURNING *`,
      [shop_name,shop_description,city,address,phone,whatsapp,req.user.user_id]
    );
    return res.json({ success:true, vendor:rows[0] });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to update vendor profile' });
  }
};

// GET /api/vendors/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const vRes = await db.query('SELECT vendor_id FROM vendor_profiles WHERE user_id=$1',[req.user.user_id]);
    if (!vRes.rows.length) return res.status(404).json({ success:false, message:'Vendor not found' });
    const vendor_id = vRes.rows[0].vendor_id;

    const [stats, recentOrders, topProducts, monthly] = await Promise.all([
      db.query(
        `SELECT COUNT(DISTINCT o.order_id) as total_orders,
                COALESCE(SUM(oi.total_price),0) as total_revenue,
                COUNT(DISTINCT p.product_id) as total_products,
                COALESCE(AVG(pr.rating),0) as avg_rating,
                COUNT(CASE WHEN o.status='pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN o.status='delivered' THEN 1 END) as delivered_orders
         FROM vendor_profiles vp
         LEFT JOIN products p ON vp.vendor_id=p.vendor_id
         LEFT JOIN order_items oi ON p.product_id=oi.product_id AND oi.vendor_id=vp.vendor_id
         LEFT JOIN orders o ON oi.order_id=o.order_id
         LEFT JOIN product_reviews pr ON p.product_id=pr.product_id
         WHERE vp.vendor_id=$1`, [vendor_id]
      ),
      db.query(
        `SELECT o.order_number,o.status,o.total_amount,o.created_at,
                oi.product_name,oi.quantity,u.full_name as customer_name
         FROM orders o JOIN order_items oi ON o.order_id=oi.order_id JOIN users u ON o.user_id=u.user_id
         WHERE oi.vendor_id=$1 ORDER BY o.created_at DESC LIMIT 10`, [vendor_id]
      ),
      db.query(
        `SELECT p.product_name,p.total_sold,p.rating,p.base_price,COALESCE(i.quantity_on_hand,0) as stock
         FROM products p LEFT JOIN inventory i ON p.product_id=i.product_id
         WHERE p.vendor_id=$1 ORDER BY p.total_sold DESC LIMIT 5`, [vendor_id]
      ),
      db.query(
        `SELECT TO_CHAR(o.created_at,'Mon YYYY') as month,COALESCE(SUM(oi.total_price),0) as revenue
         FROM orders o JOIN order_items oi ON o.order_id=oi.order_id
         WHERE oi.vendor_id=$1 AND o.created_at>=NOW()-INTERVAL '6 months'
         GROUP BY TO_CHAR(o.created_at,'Mon YYYY'),DATE_TRUNC('month',o.created_at)
         ORDER BY DATE_TRUNC('month',o.created_at)`, [vendor_id]
      ),
    ]);

    return res.json({ success:true, stats:stats.rows[0], recent_orders:recentOrders.rows, top_products:topProducts.rows, monthly_revenue:monthly.rows });
  } catch (e) {
    console.error('getDashboard:', e);
    return res.status(500).json({ success:false, message:'Failed to fetch dashboard' });
  }
};

// GET /api/vendors/products
exports.getVendorProducts = async (req, res) => {
  try {
    const vRes = await db.query('SELECT vendor_id FROM vendor_profiles WHERE user_id=$1',[req.user.user_id]);
    if (!vRes.rows.length) return res.status(404).json({ success:false, message:'Vendor not found' });

    const { rows } = await db.query(
      `SELECT p.product_id,p.product_name,p.slug,p.base_price,p.discount_price,p.is_available,
              p.is_featured,p.rating,p.review_count,p.total_sold,p.created_at,
              c.name as category_name, pi.image_url as primary_image,
              COALESCE(i.quantity_on_hand,0) as stock
       FROM products p
       LEFT JOIN categories c ON p.category_id=c.category_id
       LEFT JOIN product_images pi ON p.product_id=pi.product_id AND pi.is_primary=true
       LEFT JOIN inventory i ON p.product_id=i.product_id
       WHERE p.vendor_id=$1 ORDER BY p.created_at DESC`,
      [vRes.rows[0].vendor_id]
    );
    return res.json({ success:true, products:rows });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to fetch products' });
  }
};

// GET /api/vendors/:id  (public)
exports.getPublicVendor = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT vendor_id,shop_name,shop_description,shop_logo_url,city,rating,review_count,total_sales,is_verified,created_at FROM vendor_profiles WHERE vendor_id=$1 AND is_active=true',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success:false, message:'Vendor not found' });
    const products = await db.query(
      `SELECT p.product_id,p.product_name,p.slug,p.base_price,p.discount_price,p.rating,pi.image_url as primary_image
       FROM products p LEFT JOIN product_images pi ON p.product_id=pi.product_id AND pi.is_primary=true
       WHERE p.vendor_id=$1 AND p.is_available=true LIMIT 20`,
      [req.params.id]
    );
    return res.json({ success:true, vendor:rows[0], products:products.rows });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to fetch vendor' });
  }
};

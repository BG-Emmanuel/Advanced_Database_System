const { v4: uuid } = require('uuid');
const db = require('../db');
const { indexProductImage } = require('../services/visualSearchService');

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { page=1, limit=20, category, vendor_id, min_price, max_price, search, sort='created_at', order='DESC', featured, deal } = req.query;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const conds = ['p.is_available=true'];
    const params = [];
    let i = 1;

    if (category)   { conds.push(`c.slug=$${i++}`);         params.push(category); }
    if (vendor_id)  { conds.push(`p.vendor_id=$${i++}`);    params.push(vendor_id); }
    if (min_price)  { conds.push(`p.base_price>=$${i++}`);  params.push(parseFloat(min_price)); }
    if (max_price)  { conds.push(`p.base_price<=$${i++}`);  params.push(parseFloat(max_price)); }
    // Sanitize search to prevent injection
    if (search) {
      const sanitized = String(search).substring(0, 100).replace(/[%_\\]/g, '\\$&');
      conds.push(`(p.product_name ILIKE $${i} ESCAPE '\\' OR p.description ILIKE $${i} ESCAPE '\\')`);
      params.push(`%${sanitized}%`);
      i++;
    }
    if (featured==='true') conds.push('p.is_featured=true');
    if (deal==='true')     conds.push('p.is_deal_of_day=true');

    const sortMap = { price:'p.base_price', rating:'p.rating', created_at:'p.created_at', sold:'p.total_sold' };
    const sortCol = sortMap[sort] || 'p.created_at';
    const sortDir = order==='ASC' ? 'ASC' : 'DESC';
    const where   = conds.length ? 'WHERE '+conds.join(' AND ') : '';

    const count = await db.query(`SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id=c.category_id ${where}`, params);
    params.push(parseInt(limit), offset);

    const { rows } = await db.query(
      `SELECT p.product_id,p.product_name,p.slug,p.base_price,p.discount_price,p.currency_code,
              p.rating,p.review_count,p.total_sold,p.is_featured,p.is_deal_of_day,p.created_at,
              c.name as category_name,c.slug as category_slug,
              vp.shop_name as vendor_name,vp.is_verified as vendor_verified,vp.city as vendor_city,
              pi.image_url as primary_image,
              COALESCE(inv.quantity_on_hand,0) as stock
       FROM products p
       LEFT JOIN categories c     ON p.category_id=c.category_id
       LEFT JOIN vendor_profiles vp ON p.vendor_id=vp.vendor_id
       LEFT JOIN product_images pi  ON p.product_id=pi.product_id AND pi.is_primary=true
       LEFT JOIN inventory inv      ON p.product_id=inv.product_id
       ${where}
       ORDER BY ${sortCol} ${sortDir}
       LIMIT $${i++} OFFSET $${i}`,
      params
    );
    const total = parseInt(count.rows[0].count);
    return res.json({ success:true, products:rows, pagination:{ total, page:parseInt(page), limit:parseInt(limit), pages:Math.ceil(total/parseInt(limit)) } });
  } catch (e) {
    console.error('getProducts:', e);
    return res.status(500).json({ success:false, message:'Failed to fetch products' });
  }
};

// GET /api/products/categories
exports.getCategories = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*, COUNT(p.product_id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.category_id=p.category_id AND p.is_available=true
       WHERE c.is_active=true GROUP BY c.category_id ORDER BY c.sort_order`
    );
    return res.json({ success:true, categories:rows });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to fetch categories' });
  }
};

// GET /api/products/:slug
exports.getProduct = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*,c.name as category_name,c.slug as category_slug,
              vp.vendor_id,vp.shop_name,vp.shop_logo_url,vp.is_verified as vendor_verified,
              vp.city as vendor_city,vp.phone as vendor_phone,vp.whatsapp as vendor_whatsapp,
              vp.rating as vendor_rating,vp.review_count as vendor_review_count,
              COALESCE(SUM(inv.quantity_on_hand),0) as total_stock
       FROM products p
       LEFT JOIN categories c       ON p.category_id=c.category_id
       LEFT JOIN vendor_profiles vp ON p.vendor_id=vp.vendor_id
       LEFT JOIN inventory inv      ON p.product_id=inv.product_id
       WHERE p.slug=$1
       GROUP BY p.product_id,c.name,c.slug,vp.vendor_id,vp.shop_name,vp.shop_logo_url,
                vp.is_verified,vp.city,vp.phone,vp.whatsapp,vp.rating,vp.review_count`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ success:false, message:'Product not found' });
    const product = rows[0];

    const [imgs, attrs, reviews] = await Promise.all([
      db.query('SELECT image_url,alt_text,is_primary FROM product_images WHERE product_id=$1 ORDER BY sort_order',[product.product_id]),
      db.query(`SELECT a.attribute_name,pa.value FROM product_attributes pa JOIN attributes a ON pa.attribute_id=a.attribute_id WHERE pa.product_id=$1`,[product.product_id]),
      db.query(`SELECT pr.rating,pr.title,pr.body,pr.is_verified_purchase,pr.created_at,u.full_name as reviewer_name FROM product_reviews pr LEFT JOIN users u ON pr.user_id=u.user_id WHERE pr.product_id=$1 ORDER BY pr.created_at DESC LIMIT 10`,[product.product_id]),
    ]);

    return res.json({ success:true, product:{ ...product, images:imgs.rows, attributes:attrs.rows, reviews:reviews.rows } });
  } catch (e) {
    console.error('getProduct:', e);
    return res.status(500).json({ success:false, message:'Failed to fetch product' });
  }
};

// POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const { product_name,description,base_price,discount_price,category_id,sku,tags,weight_kg,images=[],attributes=[],initial_stock=0 } = req.body;
    const vendor = await db.query('SELECT vendor_id FROM vendor_profiles WHERE user_id=$1 AND is_active=true',[req.user.user_id]);
    if (!vendor.rows.length) return res.status(403).json({ success:false, message:'Vendor profile not found' });
    const vendor_id  = vendor.rows[0].vendor_id;
    const product_id = uuid();
    const slug = product_name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+Date.now();

    await db.query('BEGIN');
    const { rows } = await db.query(
      `INSERT INTO products (product_id,vendor_id,category_id,product_name,slug,description,base_price,discount_price,sku,tags,weight_kg)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [product_id,vendor_id,category_id,product_name,slug,description,base_price,discount_price||null,sku||null,tags||[],weight_kg||null]
    );
    for (let idx=0; idx<images.length; idx++) {
      await db.query('INSERT INTO product_images (image_id,product_id,image_url,is_primary,sort_order) VALUES ($1,$2,$3,$4,$5)',[uuid(),product_id,images[idx].url,idx===0,idx]);
    }
    if (initial_stock>0) {
      await db.query(`INSERT INTO inventory (product_id,warehouse_id,quantity_on_hand) VALUES ($1,1,$2) ON CONFLICT (product_id,warehouse_id) DO UPDATE SET quantity_on_hand=inventory.quantity_on_hand+$2`,[product_id,initial_stock]);
    }
    for (const a of attributes) {
      await db.query('INSERT INTO product_attributes (product_id,attribute_id,value) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',[product_id,a.attribute_id,a.value]);
    }
    await db.query('COMMIT');

    // Async: index product images for visual search (non-blocking)
    if (images.length > 0) {
      setImmediate(async () => {
        try {
          const path = require('path');
          const fs   = require('fs');
          for (const img of images.filter(i => i.url)) {
            const filename  = img.url.split('/uploads/').pop();
            const localPath = path.join(__dirname, '../../uploads', filename);
            if (fs.existsSync(localPath)) {
              await indexProductImage(product_id, img.url, localPath);
            }
          }
        } catch (e) {
          console.warn('Visual index failed (non-critical):', e.message);
        }
      });
    }

    return res.status(201).json({ success:true, product:rows[0] });
  } catch (e) {
    await db.query('ROLLBACK');
    console.error('createProduct:', e);
    return res.status(500).json({ success:false, message:'Failed to create product' });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const { product_name,description,base_price,discount_price,category_id,is_available,is_featured,is_deal_of_day } = req.body;
    let rows;
    if (req.user.role === 'admin') {
      ({ rows } = await db.query(
        `UPDATE products SET
           product_name=COALESCE($1,product_name), description=COALESCE($2,description),
           base_price=COALESCE($3,base_price), discount_price=$4,
           category_id=COALESCE($5,category_id), is_available=COALESCE($6,is_available),
           is_featured=COALESCE($7,is_featured), is_deal_of_day=COALESCE($8,is_deal_of_day),
           updated_at=NOW()
         WHERE product_id=$9 RETURNING *`,
        [product_name,description,base_price,discount_price||null,category_id,is_available,is_featured,is_deal_of_day,req.params.id]
      ));
    } else {
      ({ rows } = await db.query(
        `UPDATE products p SET
           product_name=COALESCE($1,p.product_name), description=COALESCE($2,p.description),
           base_price=COALESCE($3,p.base_price), discount_price=$4,
           category_id=COALESCE($5,p.category_id), is_available=COALESCE($6,p.is_available),
           is_featured=COALESCE($7,p.is_featured), is_deal_of_day=COALESCE($8,p.is_deal_of_day),
           updated_at=NOW()
         FROM vendor_profiles vp
         WHERE p.product_id=$9 AND p.vendor_id=vp.vendor_id AND vp.user_id=$10
         RETURNING p.*`,
        [product_name,description,base_price,discount_price||null,category_id,is_available,is_featured,is_deal_of_day,req.params.id,req.user.user_id]
      ));
    }

    if (!rows.length) return res.status(404).json({ success:false, message:'Product not found or not permitted' });
    return res.json({ success:true, product:rows[0] });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to update product' });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await db.query('UPDATE products SET is_available=false WHERE product_id=$1 RETURNING product_id',[req.params.id]);
    } else {
      result = await db.query(
        `UPDATE products p
         SET is_available=false
         FROM vendor_profiles vp
         WHERE p.product_id=$1 AND p.vendor_id=vp.vendor_id AND vp.user_id=$2
         RETURNING p.product_id`,
        [req.params.id, req.user.user_id]
      );
    }
    if (!result.rows.length) return res.status(404).json({ success:false, message:'Product not found or not permitted' });
    return res.json({ success:true, message:'Product removed' });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to delete product' });
  }
};

// POST /api/products/:id/reviews
exports.addReview = async (req, res) => {
  try {
    const { rating, title, body } = req.body;
    const check = await db.query(
      `SELECT oi.order_item_id FROM order_items oi JOIN orders o ON oi.order_id=o.order_id
       WHERE oi.product_id=$1 AND o.user_id=$2 AND o.status='delivered' LIMIT 1`,
      [req.params.id, req.user.user_id]
    );
    const { rows } = await db.query(
      `INSERT INTO product_reviews (review_id,product_id,user_id,rating,title,body,is_verified_purchase)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [uuid(),req.params.id,req.user.user_id,rating,title,body,check.rows.length>0]
    );
    return res.status(201).json({ success:true, review:rows[0] });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to add review' });
  }
};

const { v4: uuid } = require('uuid');
const db = require('../db');
const emailService = require('../services/emailService');

// POST /api/orders/checkout
exports.checkout = async (req, res) => {
  try {
    const { address_id, payment_method, notes } = req.body;
    if (!address_id || !payment_method)
      return res.status(400).json({ success:false, message:'Address and payment method required' });

    const cartRow = await db.query('SELECT cart_id FROM carts WHERE user_id=$1',[req.user.user_id]);
    if (!cartRow.rows.length) return res.status(400).json({ success:false, message:'Cart is empty' });
    const cartId = cartRow.rows[0].cart_id;

    const cartItems = await db.query(
      `SELECT ci.*,p.product_name,p.is_available,p.vendor_id,COALESCE(inv.quantity_on_hand,0) as stock
       FROM cart_items ci JOIN products p ON ci.product_id=p.product_id
       LEFT JOIN inventory inv ON p.product_id=inv.product_id
       WHERE ci.cart_id=$1`,
      [cartId]
    );
    if (!cartItems.rows.length) return res.status(400).json({ success:false, message:'Cart is empty' });

    for (const item of cartItems.rows) {
      if (!item.is_available) return res.status(400).json({ success:false, message:`${item.product_name} is no longer available` });
      if (item.stock < item.quantity) return res.status(400).json({ success:false, message:`Insufficient stock for ${item.product_name}` });
    }

    const addrRow = await db.query('SELECT dz.base_fee FROM user_addresses ua LEFT JOIN delivery_zones dz ON ua.delivery_zone_id=dz.zone_id WHERE ua.address_id=$1',[address_id]);
    const delivery_fee = parseFloat(addrRow.rows[0]?.base_fee || 1500);

    const userRow = await db.query('SELECT ct.discount_percentage FROM users u JOIN customer_tiers ct ON u.tier_id=ct.tier_id WHERE u.user_id=$1',[req.user.user_id]);
    const discount_pct = parseFloat(userRow.rows[0]?.discount_percentage || 0);

    const subtotal = cartItems.rows.reduce((s,i) => s + (i.unit_price * i.quantity), 0);
    const discount_amount = subtotal * discount_pct / 100;
    const total_amount    = subtotal + delivery_fee - discount_amount;
    const order_id = uuid();

    await db.query('BEGIN');

    const orderRes = await db.query(
      `INSERT INTO orders (order_id,user_id,address_id,payment_method,subtotal,delivery_fee,discount_amount,total_amount,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING order_id,order_number,status,payment_method,total_amount,created_at`,
      [order_id,req.user.user_id,address_id,payment_method,subtotal,delivery_fee,discount_amount,total_amount,notes||null]
    );

    for (const item of cartItems.rows) {
      await db.query(
        `INSERT INTO order_items (order_item_id,order_id,product_id,vendor_id,product_name,unit_price,quantity,total_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [uuid(),order_id,item.product_id,item.vendor_id,item.product_name,item.unit_price,item.quantity,item.unit_price*item.quantity]
      );
      await db.query('UPDATE inventory SET quantity_on_hand=quantity_on_hand-$1 WHERE product_id=$2',[item.quantity,item.product_id]);
      await db.query('UPDATE products SET total_sold=total_sold+$1 WHERE product_id=$2',[item.quantity,item.product_id]);
    }

    await db.query('DELETE FROM cart_items WHERE cart_id=$1',[cartId]);
    await db.query('UPDATE users SET lifetime_value=lifetime_value+$1 WHERE user_id=$2',[total_amount,req.user.user_id]);
    await db.query(
      `INSERT INTO payment_transactions (transaction_id,order_id,user_id,payment_method,amount,status)
       VALUES ($1,$2,$3,$4,$5,'pending')`,
      [uuid(),order_id,req.user.user_id,payment_method,total_amount]
    );
    await db.query('COMMIT');

    return res.status(201).json({ success:true, message:'Order placed successfully!', order:orderRes.rows[0] });
  } catch (e) {
    await db.query('ROLLBACK');
    console.error('checkout:', e);
    return res.status(500).json({ success:false, message:'Checkout failed. Please try again.' });
  }
};

// GET /api/orders
exports.getOrders = async (req, res) => {
  try {
    const { page=1, limit=10, status } = req.query;
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const offset = (safePage - 1) * safeLimit;
    const params = [req.user.user_id];
    const statusFilter = status ? `AND o.status=$2` : '';
    if (status) params.push(status);

    params.push(safeLimit, offset);

    const { rows } = await db.query(
      `SELECT o.order_id,o.order_number,o.status,o.payment_method,o.payment_status,
              o.subtotal,o.delivery_fee,o.total_amount,o.created_at,
              COUNT(oi.order_item_id) as item_count,
              ua.city,ua.neighborhood
       FROM orders o
       LEFT JOIN order_items oi ON o.order_id=oi.order_id
       LEFT JOIN user_addresses ua ON o.address_id=ua.address_id
       WHERE o.user_id=$1 ${statusFilter}
       GROUP BY o.order_id,ua.city,ua.neighborhood
       ORDER BY o.created_at DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );
    return res.json({ success:true, orders:rows, pagination: { page: safePage, limit: safeLimit } });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to fetch orders' });
  }
};

// GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT o.*,ua.recipient_name,ua.phone as delivery_phone,ua.city,ua.neighborhood,ua.landmark
       FROM orders o LEFT JOIN user_addresses ua ON o.address_id=ua.address_id
       WHERE o.order_id=$1 AND (o.user_id=$2 OR $3='admin')`,
      [req.params.id, req.user.user_id, req.user.role]
    );
    if (!rows.length) return res.status(404).json({ success:false, message:'Order not found' });

    const items = await db.query(
      `SELECT oi.*,pi.image_url as product_image FROM order_items oi
       LEFT JOIN product_images pi ON oi.product_id=pi.product_id AND pi.is_primary=true
       WHERE oi.order_id=$1`,
      [req.params.id]
    );
    return res.json({ success:true, order:{ ...rows[0], items:items.rows } });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to fetch order' });
  }
};

// PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE orders SET status='cancelled',updated_at=NOW()
       WHERE order_id=$1 AND user_id=$2 AND status IN ('pending','confirmed')
       RETURNING order_id,status`,
      [req.params.id, req.user.user_id]
    );
    if (!rows.length) return res.status(400).json({ success:false, message:'Order cannot be cancelled' });
    return res.json({ success:true, message:'Order cancelled', order:rows[0] });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to cancel order' });
  }
};

// PUT /api/orders/:id/status  (admin/vendor)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['confirmed','processing','shipped','delivered','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success:false, message:'Invalid status' });

    let rows;
    if (req.user.role === 'admin') {
      ({ rows } = await db.query(
        `UPDATE orders SET status=$1,updated_at=NOW(),
           delivered_at=CASE WHEN $1='delivered' THEN NOW() ELSE delivered_at END
         WHERE order_id=$2 RETURNING order_id,status`,
        [status, req.params.id]
      ));
    } else {
      ({ rows } = await db.query(
        `UPDATE orders o SET status=$1,updated_at=NOW(),
           delivered_at=CASE WHEN $1='delivered' THEN NOW() ELSE o.delivered_at END
         WHERE o.order_id=$2
           AND EXISTS (
             SELECT 1
             FROM order_items oi
             JOIN vendor_profiles vp ON vp.vendor_id=oi.vendor_id
             WHERE oi.order_id=o.order_id AND vp.user_id=$3
           )
         RETURNING o.order_id,o.status`,
        [status, req.params.id, req.user.user_id]
      ));
    }

    if (!rows.length) {
      return res.status(404).json({ success:false, message:'Order not found or not permitted' });
    }
    return res.json({ success:true, order:rows[0] });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to update status' });
  }
};

// GET /api/orders/all  (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { page=1, limit=20, status } = req.query;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const params = [];
    const where  = status ? `WHERE o.status=$${params.push(status)}` : '';
    params.push(parseInt(limit), offset);

    const { rows } = await db.query(
      `SELECT o.order_id,o.order_number,o.status,o.payment_method,o.total_amount,o.created_at,
              u.full_name as customer_name,u.phone as customer_phone,
              COUNT(oi.order_item_id) as item_count
       FROM orders o JOIN users u ON o.user_id=u.user_id
       LEFT JOIN order_items oi ON o.order_id=oi.order_id
       ${where}
       GROUP BY o.order_id,u.full_name,u.phone
       ORDER BY o.created_at DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );
    return res.json({ success:true, orders:rows });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to fetch orders' });
  }
};

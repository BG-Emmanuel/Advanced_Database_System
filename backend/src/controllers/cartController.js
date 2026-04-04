const { v4: uuid } = require('uuid');
const db = require('../db');

const getOrCreateCart = async (userId) => {
  let r = await db.query('SELECT cart_id FROM carts WHERE user_id=$1', [userId]);
  if (!r.rows.length) {
    r = await db.query('INSERT INTO carts (cart_id,user_id) VALUES ($1,$2) RETURNING cart_id', [uuid(), userId]);
  }
  return r.rows[0].cart_id;
};

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.user_id);
    const { rows } = await db.query(
      `SELECT ci.cart_item_id,ci.quantity,ci.unit_price,ci.added_at,
              p.product_id,p.product_name,p.slug,p.base_price,p.discount_price,p.is_available,
              pi.image_url as product_image,
              vp.shop_name as vendor_name,
              COALESCE(inv.quantity_on_hand,0) as stock
       FROM cart_items ci
       JOIN products p ON ci.product_id=p.product_id
       LEFT JOIN product_images pi ON p.product_id=pi.product_id AND pi.is_primary=true
       LEFT JOIN vendor_profiles vp ON p.vendor_id=vp.vendor_id
       LEFT JOIN inventory inv ON p.product_id=inv.product_id
       WHERE ci.cart_id=$1 ORDER BY ci.added_at DESC`,
      [cartId]
    );
    const subtotal = rows.reduce((s,i) => s + (i.unit_price * i.quantity), 0);
    return res.json({ success:true, cart:{ cart_id:cartId, items:rows, subtotal, item_count:rows.length } });
  } catch (e) {
    console.error('getCart:', e);
    return res.status(500).json({ success:false, message:'Failed to fetch cart' });
  }
};

// POST /api/cart/items
exports.addToCart = async (req, res) => {
  try {
    const { product_id, quantity=1 } = req.body;
    const cartId = await getOrCreateCart(req.user.user_id);
    const prod = await db.query('SELECT product_id,base_price,discount_price,is_available FROM products WHERE product_id=$1',[product_id]);
    if (!prod.rows.length) return res.status(404).json({ success:false, message:'Product not found' });
    if (!prod.rows[0].is_available) return res.status(400).json({ success:false, message:'Product not available' });

    const unit_price = prod.rows[0].discount_price || prod.rows[0].base_price;
    const existing = await db.query('SELECT cart_item_id,quantity FROM cart_items WHERE cart_id=$1 AND product_id=$2',[cartId,product_id]);

    if (existing.rows.length) {
      await db.query('UPDATE cart_items SET quantity=quantity+$1 WHERE cart_item_id=$2',[quantity, existing.rows[0].cart_item_id]);
    } else {
      await db.query('INSERT INTO cart_items (cart_item_id,cart_id,product_id,quantity,unit_price) VALUES ($1,$2,$3,$4,$5)',[uuid(),cartId,product_id,quantity,unit_price]);
    }
    return res.json({ success:true, message:'Item added to cart' });
  } catch (e) {
    console.error('addToCart:', e);
    return res.status(500).json({ success:false, message:'Failed to add item' });
  }
};

// PUT /api/cart/items/:itemId
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (parseInt(quantity) < 1) {
      await db.query('DELETE FROM cart_items WHERE cart_item_id=$1',[req.params.itemId]);
    } else {
      await db.query('UPDATE cart_items SET quantity=$1 WHERE cart_item_id=$2',[quantity, req.params.itemId]);
    }
    return res.json({ success:true, message:'Cart updated' });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to update cart' });
  }
};

// DELETE /api/cart/items/:itemId
exports.removeCartItem = async (req, res) => {
  try {
    await db.query('DELETE FROM cart_items WHERE cart_item_id=$1',[req.params.itemId]);
    return res.json({ success:true, message:'Item removed' });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to remove item' });
  }
};

// DELETE /api/cart
exports.clearCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.user_id);
    await db.query('DELETE FROM cart_items WHERE cart_id=$1',[cartId]);
    return res.json({ success:true, message:'Cart cleared' });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to clear cart' });
  }
};

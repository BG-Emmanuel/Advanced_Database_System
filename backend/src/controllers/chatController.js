const { v4: uuid } = require('uuid');
const db = require('../db');

/**
 * GET /api/chats/:vendorId
 * Get or create a chat conversation between current user and a vendor
 * Returns chat_id + all messages
 */
exports.getChat = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const buyerId = req.user.user_id;

    // Get vendor's user_id from vendor_profiles
    const vendorRow = await db.query(
      'SELECT user_id, shop_name FROM vendor_profiles WHERE vendor_id=$1 AND is_active=true',
      [vendorId]
    );
    if (!vendorRow.rows.length) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    const vendorUserId = vendorRow.rows[0].user_id;
    const shopName = vendorRow.rows[0].shop_name;

    // Find existing conversation
    let chatRow = await db.query(
      `SELECT chat_id FROM chats
       WHERE buyer_id=$1 AND vendor_id=$2
       LIMIT 1`,
      [buyerId, vendorId]
    );

    let chatId;
    if (!chatRow.rows.length) {
      // Create new conversation
      chatId = uuid();
      await db.query(
        `INSERT INTO chats (chat_id, buyer_id, vendor_id, vendor_user_id)
         VALUES ($1, $2, $3, $4)`,
        [chatId, buyerId, vendorId, vendorUserId]
      );

      // Auto welcome message from vendor
      await db.query(
        `INSERT INTO chat_messages (message_id, chat_id, sender_id, sender_type, text, is_system)
         VALUES ($1, $2, $3, 'vendor', $4, true)`,
        [
          uuid(), chatId, vendorUserId,
          `Hello! Welcome to ${shopName}. How can I help you today? Feel free to ask about our products, prices, or delivery options.`,
        ]
      );
    } else {
      chatId = chatRow.rows[0].chat_id;
    }

    // Mark messages as read by buyer
    await db.query(
      `UPDATE chat_messages SET read_at=NOW()
       WHERE chat_id=$1 AND sender_type='vendor' AND read_at IS NULL`,
      [chatId]
    );

    // Load messages
    const messages = await db.query(
      `SELECT cm.message_id as id,
              CASE WHEN cm.sender_id=$1 THEN 'buyer' ELSE 'vendor' END as sender,
              cm.text, cm.is_system, cm.created_at, cm.product_slug
       FROM chat_messages cm
       WHERE cm.chat_id=$2
       ORDER BY cm.created_at ASC
       LIMIT 100`,
      [buyerId, chatId]
    );

    return res.json({
      success: true,
      chat_id: chatId,
      vendor: { vendor_id: vendorId, shop_name: shopName },
      messages: messages.rows,
    });
  } catch (e) {
    console.error('getChat:', e);
    return res.status(500).json({ success: false, message: 'Failed to load chat' });
  }
};

/**
 * POST /api/chats/:vendorId/messages
 * Send a message to a vendor
 */
exports.sendMessage = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { text, product_slug } = req.body;
    const buyerId = req.user.user_id;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: 'Message text required' });
    }

    // Get/create chat
    let chatRow = await db.query(
      'SELECT chat_id, vendor_user_id FROM chats WHERE buyer_id=$1 AND vendor_id=$2',
      [buyerId, vendorId]
    );

    let chatId, vendorUserId;
    if (!chatRow.rows.length) {
      const vendorRow = await db.query(
        'SELECT user_id FROM vendor_profiles WHERE vendor_id=$1',
        [vendorId]
      );
      if (!vendorRow.rows.length) {
        return res.status(404).json({ success: false, message: 'Vendor not found' });
      }
      vendorUserId = vendorRow.rows[0].user_id;
      chatId = uuid();
      await db.query(
        'INSERT INTO chats (chat_id, buyer_id, vendor_id, vendor_user_id) VALUES ($1,$2,$3,$4)',
        [chatId, buyerId, vendorId, vendorUserId]
      );
    } else {
      chatId = chatRow.rows[0].chat_id;
      vendorUserId = chatRow.rows[0].vendor_user_id;
    }

    // Insert message
    const messageId = uuid();
    await db.query(
      `INSERT INTO chat_messages (message_id, chat_id, sender_id, sender_type, text, product_slug)
       VALUES ($1, $2, $3, 'buyer', $4, $5)`,
      [messageId, chatId, buyerId, text.trim(), product_slug || null]
    );

    // Update chat last_message_at
    await db.query(
      'UPDATE chats SET last_message_at=NOW(), updated_at=NOW() WHERE chat_id=$1',
      [chatId]
    );

    // Auto-reply from vendor (simple rule-based for demo)
    setTimeout(async () => {
      try {
        const autoReplies = [
          { keywords: ['available','stock','have'], reply: 'Yes, this product is currently available! Quantity is limited so order soon. 😊' },
          { keywords: ['price','cost','how much','combien'], reply: 'The price displayed is already our best price, but for bulk orders (2+) I can offer a discount. Contact me to discuss!' },
          { keywords: ['deliver','livr','shipping','ship'], reply: 'We deliver across Cameroon! Yaoundé and Douala: 1-2 days. Other cities: 3-5 days. Delivery fee is shown at checkout.' },
          { keywords: ['real','original','authentic','genuine','fake'], reply: 'All our products are 100% original and authentic. We offer a 7-day return guarantee if you are not satisfied.' },
          { keywords: ['payment','pay','momo','orange','mobile money'], reply: 'We accept MTN MoMo, Orange Money, and Cash on Delivery! No bank card required. 📲' },
          { keywords: ['photo','picture','image','photo'], reply: 'Sure! You can see more photos on the product page. If you need specific angles, let me know and I\'ll send them on WhatsApp.' },
          { keywords: ['discount','reduce','negotiate','promo'], reply: 'For orders of 2 or more units, I can offer 5-10% discount. Make your order and message me the order number!' },
          { keywords: ['bonjour','bonsoir','salut','hello','hi'], reply: 'Hello! Welcome to our shop. How can I help you today? 👋' },
        ];

        const msgLower = text.toLowerCase();
        const matched = autoReplies.find(r => r.keywords.some(k => msgLower.includes(k)));
        const replyText = matched?.reply || 'Thank you for your message! I\'ll get back to you shortly. For urgent questions, you can also reach us on WhatsApp. 🙏';

        await db.query(
          `INSERT INTO chat_messages (message_id, chat_id, sender_id, sender_type, text)
           VALUES ($1, $2, $3, 'vendor', $4)`,
          [uuid(), chatId, vendorUserId, replyText]
        );
        await db.query('UPDATE chats SET last_message_at=NOW() WHERE chat_id=$1', [chatId]);
      } catch (e) { /* silent */ }
    }, 1500 + Math.random() * 2000); // realistic delay 1.5-3.5s

    return res.status(201).json({ success: true, message_id: messageId });
  } catch (e) {
    console.error('sendMessage:', e);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

/**
 * GET /api/chats
 * Get all conversations for current user (buyer view)
 */
exports.getMyChats = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.chat_id, c.vendor_id, c.last_message_at,
              vp.shop_name, vp.is_verified,
              (SELECT text FROM chat_messages WHERE chat_id=c.chat_id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT COUNT(*) FROM chat_messages WHERE chat_id=c.chat_id AND sender_type='vendor' AND read_at IS NULL) as unread_count
       FROM chats c
       JOIN vendor_profiles vp ON c.vendor_id=vp.vendor_id
       WHERE c.buyer_id=$1
       ORDER BY c.last_message_at DESC NULLS LAST`,
      [req.user.user_id]
    );
    return res.json({ success: true, chats: rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to load conversations' });
  }
};

/**
 * GET /api/chats/vendor-inbox
 * Get all conversations for vendor (vendor view)
 */
exports.getVendorInbox = async (req, res) => {
  try {
    const vendorRow = await db.query(
      'SELECT vendor_id FROM vendor_profiles WHERE user_id=$1',
      [req.user.user_id]
    );
    if (!vendorRow.rows.length) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    const vendorId = vendorRow.rows[0].vendor_id;

    const { rows } = await db.query(
      `SELECT c.chat_id, c.buyer_id, c.last_message_at,
              u.full_name as buyer_name, u.phone as buyer_phone,
              (SELECT text FROM chat_messages WHERE chat_id=c.chat_id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT COUNT(*) FROM chat_messages WHERE chat_id=c.chat_id AND sender_type='buyer' AND read_at IS NULL) as unread_count
       FROM chats c
       JOIN users u ON c.buyer_id=u.user_id
       WHERE c.vendor_id=$1
       ORDER BY c.last_message_at DESC NULLS LAST`,
      [vendorId]
    );
    return res.json({ success: true, chats: rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to load inbox' });
  }
};

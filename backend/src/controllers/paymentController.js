const { v4: uuid } = require('uuid');
const crypto = require('crypto');
const db = require('../db');
const { mtnMoMo, orangeMoney } = require('../services/paymentService');

const safeCompare = (a = '', b = '') => {
  try {
    return crypto.timingSafeEqual(Buffer.from(String(a)), Buffer.from(String(b)));
  } catch {
    return false;
  }
};

const isValidWebhookSignature = (req, secret) => {
  if (!secret) return process.env.NODE_ENV !== 'production';
  const signature = req.headers['x-buy237-signature'] || req.headers['x-signature'];
  if (!signature || !req.rawBody) return false;
  const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  return safeCompare(signature, expected);
};

// POST /api/payments/initiate
// Called after order is created to trigger mobile money prompt
exports.initiatePayment = async (req, res) => {
  try {
    const { order_id, phone } = req.body;
    if (!order_id || !phone) {
      return res.status(400).json({ success: false, message: 'order_id and phone required' });
    }

    // Get the order
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE order_id=$1 AND user_id=$2',
      [order_id, req.user.user_id]
    );
    if (!orderResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = orderResult.rows[0];

    if (order.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'Order already paid' });
    }

    let result;

    if (order.payment_method === 'mtn_momo') {
      result = await mtnMoMo.requestPayment({
        amount: order.total_amount,
        phone,
        orderId: order_id,
        description: `Buy237 Order ${order.order_number}`,
      });
    } else if (order.payment_method === 'orange_money') {
      result = await orangeMoney.initiatePayment({
        amount: order.total_amount,
        phone,
        orderId: order_id,
        returnUrl: `${process.env.FRONTEND_URL}/orders/${order_id}?success=1`,
      });
    } else {
      return res.status(400).json({ success: false, message: 'Payment method does not support online initiation' });
    }

    // Record transaction
    await db.query(
      `INSERT INTO payment_transactions (transaction_id, order_id, user_id, payment_method, amount, status, external_reference, phone_number)
       VALUES ($1,$2,$3,$4,$5,'pending',$6,$7)
       ON CONFLICT DO NOTHING`,
      [result.transactionId || uuid(), order_id, req.user.user_id, order.payment_method, order.total_amount, result.transactionId, phone]
    );

    return res.json({
      success: true,
      message: result.message || 'Payment initiated. Check your phone.',
      transactionId: result.transactionId,
      paymentUrl: result.paymentUrl || null,
      sandbox: result.sandbox || false,
    });
  } catch (err) {
    console.error('initiatePayment:', err);
    return res.status(500).json({ success: false, message: err.message || 'Payment initiation failed' });
  }
};

// GET /api/payments/status/:transactionId
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Get transaction from DB
    const txResult = await db.query(
      'SELECT * FROM payment_transactions WHERE transaction_id=$1',
      [transactionId]
    );
    if (!txResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    const tx = txResult.rows[0];

    // Check with payment provider
    let providerStatus = null;
    try {
      if (tx.payment_method === 'mtn_momo') {
        providerStatus = await mtnMoMo.checkStatus(transactionId);
      }
    } catch (e) {
      console.warn('Could not check provider status:', e.message);
    }

    const isPaid = providerStatus?.status === 'SUCCESSFUL' || tx.status === 'success';

    if (isPaid && tx.status !== 'success') {
      // Update transaction and order
      await db.query(
        'UPDATE payment_transactions SET status=$1, updated_at=NOW() WHERE transaction_id=$2',
        ['success', transactionId]
      );
      await db.query(
        "UPDATE orders SET payment_status='paid', status='confirmed', updated_at=NOW() WHERE order_id=$1",
        [tx.order_id]
      );
    }

    return res.json({
      success: true,
      status: isPaid ? 'paid' : tx.status,
      transaction: { ...tx, provider_status: providerStatus?.status },
    });
  } catch (err) {
    console.error('checkPaymentStatus:', err);
    return res.status(500).json({ success: false, message: 'Failed to check payment status' });
  }
};

// POST /api/payments/momo/callback  (MTN webhook)
exports.momoCallback = async (req, res) => {
  try {
    if (!isValidWebhookSignature(req, process.env.MTN_MOMO_WEBHOOK_SECRET)) {
      return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
    }

    const { referenceId, status, financialTransactionId } = req.body;
    if (!referenceId || !status) {
      return res.status(400).json({ success: false, message: 'Malformed callback payload' });
    }

    if (status === 'SUCCESSFUL' && referenceId) {
      const tx = await db.query(
        `UPDATE payment_transactions
         SET status=$1, external_reference=COALESCE($2, external_reference), updated_at=NOW()
         WHERE transaction_id=$3 AND status!='success'
         RETURNING order_id`,
        ['success', financialTransactionId || null, referenceId]
      );
      if (tx.rows.length) {
        await db.query(
          "UPDATE orders SET payment_status='paid', status='confirmed', updated_at=NOW() WHERE order_id=$1 AND payment_status!='paid'",
          [tx.rows[0].order_id]
        );
      }
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('momoCallback:', err);
    return res.status(500).json({ success: false });
  }
};

// POST /api/payments/orange/callback (Orange Money webhook)
exports.orangeCallback = async (req, res) => {
  try {
    if (!isValidWebhookSignature(req, process.env.ORANGE_MONEY_WEBHOOK_SECRET)) {
      return res.status(401).send('Unauthorized');
    }

    const { order_id, status, txnid } = req.body;
    if (!order_id || !status) {
      return res.status(400).send('Malformed payload');
    }

    if ((status === '00' || status === 'SUCCESS') && order_id) {
      await db.query(
        "UPDATE payment_transactions SET status='success', external_reference=COALESCE($1, external_reference), updated_at=NOW() WHERE order_id=$2 AND status!='success'",
        [txnid, order_id]
      );
      await db.query(
        "UPDATE orders SET payment_status='paid', status='confirmed', updated_at=NOW() WHERE order_id=$1 AND payment_status!='paid'",
        [order_id]
      );
    }
    return res.status(200).send('OK');
  } catch (err) {
    console.error('orangeCallback:', err);
    return res.status(500).send('Error');
  }
};

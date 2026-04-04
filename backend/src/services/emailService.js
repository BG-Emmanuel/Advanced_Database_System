const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('⚠️  Email not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
    return null;
  }
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  if (!transporter) {
    // In dev, log what would be sent
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n📧 [DEV EMAIL]\nTo: ${to}\nSubject: ${subject}\n${text || ''}\n`);
    }
    return { success: false, reason: 'Email not configured' };
  }
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Buy237 <noreply@buy237.cm>',
      to, subject, html, text,
    });
    console.log(`✉️  Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Email error:', err.message);
    return { success: false, error: err.message };
  }
};

const fmt = (n) => new Intl.NumberFormat('fr-CM').format(Math.round(n));

const baseStyle = `font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:0;background:#f5f5f5`;
const headerHtml = `<div style="background:#0B8F4D;padding:24px;text-align:center">
  <span style="font-size:1.8rem;font-weight:800;color:white">Buy</span><span style="font-size:1.8rem;font-weight:800;color:#FFD700">237</span>
  <span style="font-size:1.2rem;margin-left:6px">🇨🇲</span>
</div>`;
const footerHtml = `<div style="background:#1a1a1a;padding:16px;text-align:center;color:#888;font-size:12px">
  Buy237 — Cameroon's E-Commerce Platform | <a href="${process.env.FRONTEND_URL}" style="color:#0B8F4D">buy237.cm</a>
</div>`;

exports.sendWelcomeEmail = async (to, name) => sendEmail({
  to,
  subject: 'Welcome to Buy237 🇨🇲',
  html: `<div style="${baseStyle}">${headerHtml}
    <div style="background:white;padding:32px">
      <h2 style="color:#1a1a1a">Welcome, ${name}! 🎉</h2>
      <p style="color:#555">You've successfully joined Buy237. Here's what you can do:</p>
      <ul style="color:#555;line-height:2">
        <li>🛒 Shop thousands of products across Cameroon</li>
        <li>📲 Pay with MTN MoMo or Orange Money</li>
        <li>📦 Track your orders in real-time</li>
        <li>🏪 Sell your own products as a vendor</li>
      </ul>
      <div style="text-align:center;margin:24px 0">
        <a href="${process.env.FRONTEND_URL}" style="background:#0B8F4D;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Start Shopping →</a>
      </div>
    </div>${footerHtml}</div>`,
  text: `Welcome to Buy237, ${name}! Visit ${process.env.FRONTEND_URL} to start shopping.`,
});

exports.sendPasswordReset = async (to, resetToken, name) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  return sendEmail({
    to,
    subject: 'Reset your Buy237 password',
    html: `<div style="${baseStyle}">${headerHtml}
      <div style="background:white;padding:32px">
        <h2>Reset your password</h2>
        <p style="color:#555">Hi ${name}, you requested a password reset. This link expires in <strong>1 hour</strong>.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${resetUrl}" style="background:#FF6B00;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Reset Password</a>
        </div>
        <p style="color:#888;font-size:13px">If you didn't request this, ignore this email — your password won't change.</p>
        <div style="background:#f9f9f9;border-radius:8px;padding:12px;margin-top:16px;word-break:break-all;font-size:12px;color:#888">
          Or copy this link: ${resetUrl}
        </div>
      </div>${footerHtml}</div>`,
    text: `Hi ${name}, reset your Buy237 password here: ${resetUrl} (expires in 1 hour)`,
  });
};

exports.sendOrderConfirmation = async (to, order, name) => sendEmail({
  to,
  subject: `Order Confirmed — ${order.order_number}`,
  html: `<div style="${baseStyle}">${headerHtml}
    <div style="background:white;padding:32px">
      <div style="background:#E8F5EE;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
        <div style="font-size:2.5rem">🎉</div>
        <h2 style="color:#0B8F4D;margin:8px 0">Order Placed!</h2>
        <p style="color:#555;margin:4px 0">Order number: <strong>${order.order_number}</strong></p>
      </div>
      <p style="color:#555">Hi ${name}, your order is confirmed and being processed.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#888">Payment method</td>
            <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600">${(order.payment_method||'').replace(/_/g,' ')}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#888">Delivery fee</td>
            <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right">${fmt(order.delivery_fee)} FCFA</td></tr>
        <tr><td style="padding:10px 0;color:#1a1a1a;font-weight:700;font-size:1.1rem">Total</td>
            <td style="padding:10px 0;text-align:right;color:#FF6B00;font-weight:800;font-size:1.1rem">${fmt(order.total_amount)} FCFA</td></tr>
      </table>
      <div style="text-align:center;margin:24px 0">
        <a href="${process.env.FRONTEND_URL}/orders/${order.order_id}" style="background:#0B8F4D;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Track Order →</a>
      </div>
    </div>${footerHtml}</div>`,
  text: `Hi ${name}, order ${order.order_number} confirmed. Total: ${fmt(order.total_amount)} FCFA.`,
});

exports.sendOrderStatusUpdate = async (to, order, name) => {
  const statusMessages = {
    confirmed:  { emoji: '✅', msg: 'Your order has been confirmed and is being prepared.' },
    processing: { emoji: '⚙️', msg: 'Your order is being processed at our warehouse.' },
    shipped:    { emoji: '🚚', msg: 'Your order is on its way! Expected delivery soon.' },
    delivered:  { emoji: '📦', msg: 'Your order has been delivered. Enjoy your purchase!' },
    cancelled:  { emoji: '❌', msg: 'Your order has been cancelled. Contact us if you need help.' },
  };
  const { emoji, msg } = statusMessages[order.status] || { emoji: '📋', msg: 'Your order status has been updated.' };
  return sendEmail({
    to,
    subject: `Order ${order.order_number} — ${order.status.charAt(0).toUpperCase()+order.status.slice(1)}`,
    html: `<div style="${baseStyle}">${headerHtml}
      <div style="background:white;padding:32px">
        <div style="text-align:center;font-size:3rem;margin-bottom:12px">${emoji}</div>
        <h2 style="text-align:center">Order Status Update</h2>
        <p style="color:#555">Hi ${name}, ${msg}</p>
        <p style="color:#888;font-size:14px">Order: <strong>${order.order_number}</strong></p>
        <div style="text-align:center;margin:24px 0">
          <a href="${process.env.FRONTEND_URL}/orders/${order.order_id}" style="background:#0B8F4D;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">View Order →</a>
        </div>
      </div>${footerHtml}</div>`,
    text: `Hi ${name}, your order ${order.order_number} is now ${order.status}. ${msg}`,
  });
};

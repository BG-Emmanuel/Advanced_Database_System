const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const url = require('url');
const db     = require('../db');
const email  = require('../services/emailService');

// Password strength validator
const validatePasswordStrength = (password) => {
  if (password.length < 8) return false; // Minimum 8 characters
  if (!/[a-z]/.test(password)) return false; // At least one lowercase
  if (!/[A-Z]/.test(password)) return false; // At least one uppercase
  if (!/[0-9]/.test(password)) return false; // At least one digit
  if (!/[^a-zA-Z0-9]/.test(password)) return false; // At least one special character
  return true;
};

// Validate redirect URL to prevent open redirect
const isValidFrontendUrl = (redirectUrl) => {
  try {
    const { protocol, hostname } = new url.URL(redirectUrl);
    const allowedHosts = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(u => new url.URL(u.trim()).hostname);
    return protocol === 'http:' || protocol === 'https:' && allowedHosts.includes(hostname);
  } catch {
    return false;
  }
};

const googleClient = new OAuth2Client();

const makeToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `buy237_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${isProd ? '; Secure' : ''}`
  );
};

const getGoogleAudiences = () =>
  (process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_IDS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

exports.register = async (req, res) => {
  try {
    const { email: userEmail, phone, password, full_name, preferred_language = 'en' } = req.body;
    if (!userEmail || !password || !full_name)
      return res.status(400).json({ success: false, message: 'Email, password and name are required' });
    if (!validatePasswordStrength(password))
      return res.status(400).json({ success: false, message: 'Password must be 8+ chars with uppercase, lowercase, digit, and special character' });

    const existing = await db.query(
      'SELECT user_id FROM users WHERE email=$1 OR (phone=$2 AND $2 IS NOT NULL AND phone IS NOT NULL)',
      [userEmail.toLowerCase(), phone || null]
    );
    if (existing.rows.length)
      return res.status(409).json({ success: false, message: 'Email or phone already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO users (user_id,email,phone,password_hash,full_name,preferred_language,tier_id)
       VALUES ($1,$2,$3,$4,$5,$6,1)
       RETURNING user_id,email,phone,full_name,role,tier_id,preferred_language,created_at`,
      [uuid(), userEmail.toLowerCase(), phone || null, password_hash, full_name, preferred_language]
    );
    const user = rows[0];
    const token = makeToken(user.user_id, user.role);
    // Send welcome email (non-blocking)
    email.sendWelcomeEmail(user.email, user.full_name).catch(console.warn);
    setAuthCookie(res, token);
    return res.status(201).json({ success: true, message: 'Account created successfully', token, user });
  } catch (e) {
    console.error('register:', e);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email: userEmail, password } = req.body;
    if (!userEmail || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const { rows } = await db.query(
      `SELECT u.*, ct.tier_name, ct.discount_percentage
       FROM users u LEFT JOIN customer_tiers ct ON u.tier_id=ct.tier_id
       WHERE u.email=$1 AND u.is_active=true`,
      [userEmail.toLowerCase()]
    );
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const user = rows[0];
    await db.query('UPDATE users SET last_login=NOW() WHERE user_id=$1', [user.user_id]);
    const { password_hash, ...safe } = user;
    const token = makeToken(user.user_id, user.role);
    setAuthCookie(res, token);
    return res.json({ success: true, message: 'Login successful', token, user: safe });
  } catch (e) {
    console.error('login:', e);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { credential, preferred_language = 'en' } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    const audiences = getGoogleAudiences();
    if (!audiences.length) {
      return res.status(500).json({ success: false, message: 'Google authentication is not configured on server' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: audiences,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ success: false, message: 'Google account email is not verified' });
    }

    const emailAddress = payload.email.toLowerCase();
    const fullName = payload.name || [payload.given_name, payload.family_name].filter(Boolean).join(' ') || 'Google User';
    const profileImage = payload.picture || null;

    const existing = await db.query(
      `SELECT u.*, ct.tier_name, ct.discount_percentage
       FROM users u LEFT JOIN customer_tiers ct ON u.tier_id=ct.tier_id
       WHERE u.email=$1`,
      [emailAddress]
    );

    let safeUser;
    if (existing.rows.length) {
      const user = existing.rows[0];
      if (!user.is_active) {
        return res.status(403).json({ success: false, message: 'Account is inactive. Please contact support.' });
      }

      await db.query(
        `UPDATE users
         SET full_name=COALESCE($1, full_name),
             profile_image_url=COALESCE($2, profile_image_url),
             preferred_language=COALESCE($3, preferred_language),
             last_login=NOW(),
             updated_at=NOW()
         WHERE user_id=$4`,
        [fullName, profileImage, preferred_language || null, user.user_id]
      );

      const refreshed = await db.query(
        `SELECT u.*, ct.tier_name, ct.discount_percentage
         FROM users u LEFT JOIN customer_tiers ct ON u.tier_id=ct.tier_id
         WHERE u.user_id=$1`,
        [user.user_id]
      );
      const { password_hash, ...rest } = refreshed.rows[0];
      safeUser = rest;
    } else {
      const randomPasswordHash = await bcrypt.hash(`google-${uuid()}`, 10);
      const created = await db.query(
        `INSERT INTO users (user_id,email,password_hash,full_name,profile_image_url,preferred_language,tier_id,is_verified,last_login)
         VALUES ($1,$2,$3,$4,$5,$6,1,true,NOW())
         RETURNING user_id,email,phone,full_name,role,tier_id,preferred_language,profile_image_url,is_verified,created_at`,
        [uuid(), emailAddress, randomPasswordHash, fullName, profileImage, preferred_language]
      );
      safeUser = created.rows[0];
    }

    const token = makeToken(safeUser.user_id, safeUser.role);
    setAuthCookie(res, token);
    return res.json({ success: true, message: 'Google login successful', token, user: safeUser });
  } catch (e) {
    console.error('googleAuth:', e);
    return res.status(401).json({ success: false, message: 'Google authentication failed' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email: userEmail } = req.body;
    if (!userEmail) return res.status(400).json({ success: false, message: 'Email required' });

    const { rows } = await db.query(
      'SELECT user_id, full_name FROM users WHERE email=$1 AND is_active=true',
      [userEmail.toLowerCase()]
    );
    // Always respond with same message to prevent email enumeration
    const successMsg = { success: true, message: 'If an account exists with this email, a reset link has been sent.' };
    if (!rows.length) return res.json(successMsg);

    const resetToken = jwt.sign(
      { userId: rows[0].user_id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send reset email
    await email.sendPasswordReset(userEmail, resetToken, rows[0].full_name);

    return res.json(successMsg);
  } catch (e) {
    console.error('forgotPassword:', e);
    return res.status(500).json({ success: false, message: 'Failed to process request' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password)
      return res.status(400).json({ success: false, message: 'Token and new password required' });
    if (!validatePasswordStrength(new_password))
      return res.status(400).json({ success: false, message: 'Password must be 8+ chars with uppercase, lowercase, digit, and special character' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link. Please request a new one.' });
    }
    if (decoded.type !== 'password_reset')
      return res.status(400).json({ success: false, message: 'Invalid reset token' });

    const password_hash = await bcrypt.hash(new_password, 10);
    const { rowCount } = await db.query(
      'UPDATE users SET password_hash=$1, updated_at=NOW() WHERE user_id=$2',
      [password_hash, decoded.userId]
    );
    if (!rowCount) return res.status(404).json({ success: false, message: 'User not found' });
    res.setHeader('Set-Cookie', 'buy237_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (e) {
    console.error('resetPassword:', e);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.user_id,u.email,u.phone,u.full_name,u.role,u.profile_image_url,
              u.preferred_language,u.is_verified,u.lifetime_value,u.created_at,
              ct.tier_name,ct.discount_percentage
       FROM users u LEFT JOIN customer_tiers ct ON u.tier_id=ct.tier_id
       WHERE u.user_id=$1`,
      [req.user.user_id]
    );
    return res.json({ success: true, user: rows[0] });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone, preferred_language } = req.body;
    const { rows } = await db.query(
      `UPDATE users SET
         full_name=COALESCE($1,full_name),
         phone=COALESCE($2,phone),
         preferred_language=COALESCE($3,preferred_language),
         updated_at=NOW()
       WHERE user_id=$4
       RETURNING user_id,email,phone,full_name,preferred_language`,
      [full_name||null, phone||null, preferred_language||null, req.user.user_id]
    );
    return res.json({ success: true, user: rows[0] });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ success: false, message: 'Both passwords required' });
    if (!validatePasswordStrength(new_password))
      return res.status(400).json({ success: false, message: 'Password must be 8+ chars with uppercase, lowercase, digit, and special character' });

    const { rows } = await db.query('SELECT password_hash FROM users WHERE user_id=$1', [req.user.user_id]);
    if (!(await bcrypt.compare(current_password, rows[0].password_hash)))
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    await db.query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE user_id=$2',
      [await bcrypt.hash(new_password, 10), req.user.user_id]);
    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

exports.logout = async (_req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `buy237_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? '; Secure' : ''}`
  );
  return res.json({ success: true, message: 'Logged out' });
};

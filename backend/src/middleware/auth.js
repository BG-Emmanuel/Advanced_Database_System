const jwt = require('jsonwebtoken');
const db  = require('../db');

const getTokenFromRequest = (req) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.split(' ')[1];

  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)buy237_token=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);

  return null;
};

const authenticate = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token)
      return res.status(401).json({ success: false, message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query(
      'SELECT user_id, email, full_name, role, is_active FROM users WHERE user_id=$1',
      [decoded.userId]
    );
    if (!rows.length || !rows[0].is_active)
      return res.status(401).json({ success: false, message: 'User not found or inactive' });

    req.user = rows[0];
    next();
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ success: false, message: msg });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { rows } = await db.query('SELECT user_id, email, full_name, role FROM users WHERE user_id=$1 AND is_active=true',[decoded.userId]);
      if (rows.length) req.user = rows[0];
    }
  } catch (_) { /* silent */ }
  next();
};

module.exports = { authenticate, requireRole, optionalAuth };

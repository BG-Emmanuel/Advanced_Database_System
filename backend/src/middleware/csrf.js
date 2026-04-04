const tokens = new Map();

// Generate a CSRF token for the user session
const generateToken = (userIdOrSessionId) => {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  tokens.set(token, userIdOrSessionId);
  return token;
};

// Verify CSRF token (for state-changing operations)
const verifyCsrfToken = (req, res, next) => {
  // Skip CSRF check for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for non-API routes
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Skip for webhook endpoints
  if (req.path.includes('/callback') || req.path.includes('/webhook')) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body?.csrf_token;
  const sessionId = req.user?.user_id || req.sessionID;

  if (!token) {
    return res.status(403).json({ success: false, message: 'CSRF token missing' });
  }

  if (!tokens.has(token)) {
    return res.status(403).json({ success: false, message: 'Invalid CSRF token' });
  }

  // Validate token belongs to this user/session
  if (tokens.get(token) !== sessionId) {
    return res.status(403).json({ success: false, message: 'CSRF token mismatch' });
  }

  // Token validated, remove it (single-use)
  tokens.delete(token);
  next();
};

module.exports = { generateToken, verifyCsrfToken };

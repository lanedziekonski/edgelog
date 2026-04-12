const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'edgelog-jwt-secret';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.userId = payload.userId;
    req.userPlan = payload.plan;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requirePlan(...plans) {
  const PLAN_ORDER = ['free', 'trader', 'pro', 'elite'];
  const minIdx = Math.min(...plans.map(p => PLAN_ORDER.indexOf(p)));

  return (req, res, next) => {
    const userIdx = PLAN_ORDER.indexOf(req.userPlan || 'free');
    if (userIdx >= minIdx) return next();
    res.status(403).json({
      error: `This feature requires the ${plans[0]} plan or higher`,
      requiredPlan: plans[0],
    });
  };
}

module.exports = { signToken, requireAuth, requirePlan };

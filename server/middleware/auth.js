import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_change_this';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

// 预先哈希管理员密码
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

/**
 * 验证管理员登录
 */
export function verifyAdminLogin(username, password) {
  if (username !== ADMIN_USERNAME) {
    return false;
  }

  return bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
}

/**
 * 生成 JWT Token
 */
export function generateToken(username) {
  return jwt.sign(
    { username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * 认证中间件
 */
export function authMiddleware(req, res, next) {
  // 公开路径，不需要认证
  const publicPaths = ['/api/auth/login', '/api/share/'];

  if (publicPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // 从 Header 中获取 Token
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }

  // 将用户信息附加到请求对象
  req.user = payload;
  next();
}

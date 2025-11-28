import express from 'express';
import { verifyAdminLogin, generateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * 管理员登录
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  if (!verifyAdminLogin(username, password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = generateToken(username);

  res.json({
    success: true,
    token,
    username
  });
});

/**
 * GET /api/auth/verify
 * 验证当前 Token 是否有效
 */
router.get('/verify', (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export default router;

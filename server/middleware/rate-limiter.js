// 简单的内存频率限制实现
const requestCounts = new Map();

// 清理过期记录
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.resetTime > 60000) {
      requestCounts.delete(key);
    }
  }
}, 60000);

/**
 * 频率限制中间件
 * @param {number} maxRequests - 最大请求数
 * @param {number} windowMs - 时间窗口（毫秒）
 */
export function rateLimiter(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    // 使用 IP 作为标识
    const identifier = req.ip || req.connection.remoteAddress;

    const now = Date.now();
    const data = requestCounts.get(identifier);

    if (!data) {
      // 首次请求
      requestCounts.set(identifier, {
        count: 1,
        resetTime: now
      });
      return next();
    }

    // 检查是否需要重置计数
    if (now - data.resetTime > windowMs) {
      data.count = 1;
      data.resetTime = now;
      return next();
    }

    // 增加计数
    data.count++;

    // 检查是否超限
    if (data.count > maxRequests) {
      return res.status(429).json({
        error: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil((windowMs - (now - data.resetTime)) / 1000)
      });
    }

    next();
  };
}

/**
 * 针对登录接口的严格限制
 */
export const loginRateLimiter = rateLimiter(5, 60000); // 每分钟最多 5 次

/**
 * 针对 API 接口的一般限制
 */
export const apiRateLimiter = rateLimiter(100, 60000); // 每分钟最多 100 次

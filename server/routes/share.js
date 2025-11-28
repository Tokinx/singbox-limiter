import express from 'express';
import { getClientByShareToken, getClientTrafficHistory } from '../utils/database.js';
import { buildRealityUrl, buildHysteria2Url } from '../utils/singbox-config.js';

const router = express.Router();

/**
 * GET /api/share/:token
 * 获取分享页面数据（公开访问，无需认证）
 */
router.get('/:token', (req, res) => {
  try {
    const client = getClientByShareToken(req.params.token);

    if (!client) {
      return res.status(404).json({ error: '分享链接无效或已失效' });
    }

    // 计算流量使用百分比
    let usagePercent = 0;
    if (client.limit_bytes > 0) {
      usagePercent = Math.min(100, (client.used_bytes / client.limit_bytes) * 100);
    }

    // 格式化流量数据
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    // 获取最近 24 小时流量历史
    const history = getClientTrafficHistory(client.id, 24);

    // 计算下次重置时间
    let nextResetDate = null;
    if (client.reset_interval === 'monthly' && client.reset_day) {
      const now = new Date();
      const currentDay = now.getDate();
      const resetDay = client.reset_day;

      let nextReset = new Date(now.getFullYear(), now.getMonth(), resetDay);

      // 如果本月的重置日已过，计算下个月的
      if (currentDay >= resetDay) {
        nextReset = new Date(now.getFullYear(), now.getMonth() + 1, resetDay);
      }

      nextResetDate = nextReset.toISOString();
    }

    // 返回分享页面数据
    res.json({
      name: client.name,
      active: client.active,
      used: formatBytes(client.used_bytes),
      limit: client.limit_bytes > 0 ? formatBytes(client.limit_bytes) : '无限制',
      usagePercent: usagePercent.toFixed(1),
      expiryDate: client.expiry_date,
      nextResetDate,
      resetDay: client.reset_day,
      history: history.map(h => ({
        timestamp: h.timestamp,
        upload: h.upload_bytes,
        download: h.download_bytes,
        total: h.total_bytes
      })),
      urls: {
        reality: buildRealityUrl(client),
        hysteria2: buildHysteria2Url(client)
      }
    });
  } catch (error) {
    console.error('获取分享页面数据失败:', error);
    res.status(500).json({ error: '获取分享页面数据失败' });
  }
});

export default router;

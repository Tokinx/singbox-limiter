import express from 'express';
import { getClientByShareToken, getClientTrafficHistory } from '../utils/database.js';
import { buildRealityUrl, buildHysteria2Url } from '../utils/singbox-config.js';

const router = express.Router();

/**
 * 将数据库字段转换为 API 响应格式 (snake_case -> camelCase)
 */
function toClientResponse(dbClient) {
  if (!dbClient) return null;
  return {
    id: dbClient.id,
    name: dbClient.name,
    email: dbClient.email,
    uuid: dbClient.uuid,
    flow: dbClient.flow,
    limitBytes: dbClient.limit_bytes,
    usedBytes: dbClient.used_bytes,
    resetInterval: dbClient.reset_interval,
    resetDay: dbClient.reset_day,
    expiryDate: dbClient.expiry_date,
    active: dbClient.active === 1,
    serverIp: dbClient.server_ip,
    realityPort: dbClient.reality_port,
    hysteriaPort: dbClient.hysteria_port,
    sni: dbClient.sni,
    publicKey: dbClient.public_key,
    shortId: dbClient.short_id,
  };
}

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

    // 获取最近 24 小时流量历史
    const history = getClientTrafficHistory(client.id, 24);

    // 转换客户端数据为 camelCase 格式
    const clientData = toClientResponse(client);

    // 添加流量历史
    clientData.history = history.map(h => ({
      timestamp: h.timestamp,
      upload: h.upload_bytes,
      download: h.download_bytes,
    }));

    // 返回分享页面数据
    res.json({
      client: clientData,
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

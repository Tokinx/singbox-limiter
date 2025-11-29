import express from 'express';
import { randomUUID } from 'crypto';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientTrafficHistory,
  resetClientTraffic,
  addAuditLog
} from '../utils/database.js';
import {
  generateRealityKeyPair,
  generateShortId,
  generateObfsPassword
} from '../utils/cert-generator.js';
import {
  generateSingBoxConfig,
  buildRealityUrl,
  buildHysteria2Url,
  generateDockerCompose
} from '../utils/singbox-config.js';
import {
  createClientContainer,
  stopContainer,
  startContainer,
  removeContainer,
  isContainerRunning
} from '../services/docker-monitor.js';
import { unlinkSync } from 'fs';
import { join } from 'path';

const router = express.Router();

/**
 * 将数据库字段转换为 API 响应格式 (snake_case -> camelCase)
 */
function toClientResponse(dbClient) {
  if (!dbClient) return null;
  return {
    id: dbClient.id,
    name: dbClient.name,
    remark: dbClient.remark || '',
    uuid: dbClient.uuid,
    flow: dbClient.flow,
    limitBytes: dbClient.limit_bytes,
    usedBytes: dbClient.used_bytes,
    tempBytes: dbClient.temp_bytes || 0,
    resetInterval: dbClient.reset_interval,
    resetDay: dbClient.reset_day,
    expiryDate: dbClient.expiry_date,
    active: dbClient.active === 1,
    serverIp: dbClient.server_ip,
    realityPort: dbClient.reality_port,
    hysteriaPort: dbClient.hysteria_port,
    sni: dbClient.sni,
    publicKey: dbClient.public_key,
    privateKey: dbClient.private_key,
    shortId: dbClient.short_id,
    obfsPassword: dbClient.obfs_password,
    containerName: dbClient.container_name,
    shareToken: dbClient.share_token,
  };
}

/**
 * GET /api/clients
 * 获取所有客户端列表
 */
router.get('/', async (req, res) => {
  try {
    const clients = getAllClients();

    // 附加容器运行状态并转换字段
    const clientsWithStatus = await Promise.all(
      clients.map(async (client) => {
        const containerRunning = client.container_name
          ? await isContainerRunning(client.container_name)
          : false;

        return {
          ...toClientResponse(client),
          containerRunning
        };
      })
    );

    res.json(clientsWithStatus);
  } catch (error) {
    console.error('获取客户端列表失败:', error);
    res.status(500).json({ error: '获取客户端列表失败' });
  }
});

/**
 * GET /api/clients/:id
 * 获取单个客户端详情
 */
router.get('/:id', async (req, res) => {
  try {
    const client = getClientById(req.params.id);

    if (!client) {
      return res.status(404).json({ error: '客户端不存在' });
    }

    // 获取容器运行状态
    const containerRunning = client.container_name
      ? await isContainerRunning(client.container_name)
      : false;

    res.json({
      ...toClientResponse(client),
      containerRunning
    });
  } catch (error) {
    console.error('获取客户端详情失败:', error);
    res.status(500).json({ error: '获取客户端详情失败' });
  }
});

/**
 * POST /api/clients
 * 创建新客户端
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      remark,
      limitGb = 0,
      resetInterval = 'monthly',
      resetDay = 1,
      expiryDate,
      realityPort,
      hysteriaPort,
      sni
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: '客户端名称不能为空' });
    }

    if (!realityPort || !hysteriaPort) {
      return res.status(400).json({ error: '端口配置不能为空' });
    }

    // 生成客户端 ID 和配置
    const clientId = `client-${Date.now()}`;
    const uuid = randomUUID();
    const { publicKey, privateKey } = generateRealityKeyPair();
    const shortId = generateShortId();
    const obfsPassword = generateObfsPassword();
    const containerName = `singbox-${clientId}`;
    const shareToken = randomUUID();

    const newClient = {
      id: clientId,
      name,
      remark: remark || '',
      uuid,
      flow: 'xtls-rprx-vision',
      limit_bytes: limitGb === 0 ? -1 : limitGb * 1024 * 1024 * 1024,
      reset_interval: resetInterval,
      reset_day: Math.min(31, Math.max(1, resetDay)),
      expiry_date: expiryDate || null,
      server_ip: process.env.SERVER_IP || 'your_server_ip',
      reality_port: realityPort,
      hysteria_port: hysteriaPort,
      sni: sni || process.env.DEFAULT_SNI || 'music.apple.com',
      public_key: publicKey,
      private_key: privateKey,
      short_id: shortId,
      obfs_password: obfsPassword,
      container_name: containerName,
      share_token: shareToken
    };

    // 保存到数据库
    createClient(newClient);

    // 生成 sing-box 配置文件
    const { configPath } = generateSingBoxConfig(newClient);

    // 创建并启动 Docker 容器
    const containerCreated = await createClientContainer(newClient);

    if (!containerCreated) {
      // 如果容器创建失败，删除客户端记录
      deleteClient(clientId);
      return res.status(500).json({ error: '容器创建失败，请检查 Docker 配置' });
    }

    // 记录审计日志
    addAuditLog(clientId, 'CREATE', `创建客户端: ${name}`);

    res.status(201).json({
      success: true,
      client: {
        ...toClientResponse(newClient),
        configPath
      }
    });
  } catch (error) {
    console.error('创建客户端失败:', error);
    res.status(500).json({ error: '创建客户端失败: ' + error.message });
  }
});

/**
 * PUT /api/clients/:id
 * 更新客户端配置
 */
router.put('/:id', async (req, res) => {
  try {
    const client = getClientById(req.params.id);

    if (!client) {
      return res.status(404).json({ error: '客户端不存在' });
    }

    const {
      name,
      remark,
      limitGb,
      tempGb,
      resetDay,
      expiryDate,
      realityPort,
      hysteriaPort,
      sni,
      active
    } = req.body;

    const updates = {};
    let needsConfigRegenerate = false;

    if (name !== undefined) updates.name = name;
    if (remark !== undefined) updates.remark = remark;
    if (limitGb !== undefined) {
      updates.limit_bytes = limitGb === 0 ? -1 : limitGb * 1024 * 1024 * 1024;
    }
    if (tempGb !== undefined) {
      updates.temp_bytes = tempGb * 1024 * 1024 * 1024;
    }
    if (resetDay !== undefined) {
      updates.reset_day = Math.min(31, Math.max(1, resetDay));
    }
    if (expiryDate !== undefined) updates.expiry_date = expiryDate;

    // 端口和 SNI 变更需要重新生成配置
    if (realityPort !== undefined && realityPort !== client.reality_port) {
      updates.reality_port = realityPort;
      needsConfigRegenerate = true;
    }
    if (hysteriaPort !== undefined && hysteriaPort !== client.hysteria_port) {
      updates.hysteria_port = hysteriaPort;
      needsConfigRegenerate = true;
    }
    if (sni !== undefined && sni !== client.sni) {
      updates.sni = sni;
      needsConfigRegenerate = true;
    }

    // 处理激活状态变更
    if (active !== undefined && active !== (client.active === 1)) {
      updates.active = active ? 1 : 0;

      if (client.container_name) {
        if (active) {
          await startContainer(client.container_name);
          addAuditLog(req.params.id, 'ENABLE', '手动启用客户端');
        } else {
          await stopContainer(client.container_name);
          addAuditLog(req.params.id, 'DISABLE', '手动停用客户端');
        }
      }
    }

    updateClient(req.params.id, updates);

    // 如果端口或 SNI 变更，需要重新生成配置并重启容器
    if (needsConfigRegenerate) {
      const updatedClientForConfig = getClientById(req.params.id);
      generateSingBoxConfig(updatedClientForConfig);

      // 重启容器以应用新配置
      if (client.container_name && client.active === 1) {
        await stopContainer(client.container_name);
        await startContainer(client.container_name);
        addAuditLog(req.params.id, 'CONFIG_UPDATE', '配置更新，容器已重启');
      }
    }

    // 获取更新后的客户端数据
    const updatedClient = getClientById(req.params.id);

    res.json({
      success: true,
      client: toClientResponse(updatedClient)
    });
  } catch (error) {
    console.error('更新客户端失败:', error);
    res.status(500).json({ error: '更新客户端失败' });
  }
});

/**
 * DELETE /api/clients/:id
 * 删除客户端
 */
router.delete('/:id', async (req, res) => {
  try {
    const client = getClientById(req.params.id);

    if (!client) {
      return res.status(404).json({ error: '客户端不存在' });
    }

    // 删除 Docker 容器
    if (client.container_name) {
      await removeContainer(client.container_name);
    }

    // 删除配置文件
    try {
      const configPath = join(process.cwd(), 'configs/clients', `${client.id}.json`);
      unlinkSync(configPath);
    } catch (err) {
      console.warn('删除配置文件失败:', err.message);
    }

    // 删除数据库记录
    deleteClient(req.params.id);

    // 记录审计日志
    addAuditLog(null, 'DELETE', `删除客户端: ${client.name} (${req.params.id})`);

    res.json({ success: true });
  } catch (error) {
    console.error('删除客户端失败:', error);
    res.status(500).json({ error: '删除客户端失败' });
  }
});

/**
 * GET /api/clients/:id/traffic
 * 获取客户端流量历史
 */
router.get('/:id/traffic', (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const history = getClientTrafficHistory(req.params.id, hours);

    // 转换字段名为 camelCase
    const formattedHistory = history.map(h => ({
      timestamp: h.timestamp,
      upload: h.upload_bytes || 0,
      download: h.download_bytes || 0,
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error('获取流量历史失败:', error);
    res.status(500).json({ error: '获取流量历史失败' });
  }
});

/**
 * POST /api/clients/:id/reset-traffic
 * 手动重置客户端流量
 */
router.post('/:id/reset-traffic', (req, res) => {
  try {
    const client = getClientById(req.params.id);

    if (!client) {
      return res.status(404).json({ error: '客户端不存在' });
    }

    resetClientTraffic(req.params.id);

    // 如果之前因流量超限被停用，重新启用
    if (!client.active && client.container_name) {
      const isExpired = client.expiry_date && new Date(client.expiry_date) < new Date();

      if (!isExpired) {
        startContainer(client.container_name);
        updateClient(req.params.id, { active: 1 });
      }
    }

    addAuditLog(req.params.id, 'RESET_TRAFFIC', '手动重置流量');

    res.json({ success: true });
  } catch (error) {
    console.error('重置流量失败:', error);
    res.status(500).json({ error: '重置流量失败' });
  }
});

/**
 * GET /api/clients/:id/urls
 * 获取客户端连接 URL
 */
router.get('/:id/urls', (req, res) => {
  try {
    const client = getClientById(req.params.id);

    if (!client) {
      return res.status(404).json({ error: '客户端不存在' });
    }

    // 生成分享页面 URL
    const shareUrl = `${req.protocol}://${req.get('host')}/#/share/${client.share_token}`;

    res.json({
      reality: buildRealityUrl(client),
      hysteria2: buildHysteria2Url(client),
      shareUrl
    });
  } catch (error) {
    console.error('生成连接 URL 失败:', error);
    res.status(500).json({ error: '生成连接 URL 失败' });
  }
});

/**
 * GET /api/clients/:id/docker-compose
 * 获取客户端 docker-compose 配置
 */
router.get('/:id/docker-compose', (req, res) => {
  try {
    const client = getClientById(req.params.id);

    if (!client) {
      return res.status(404).json({ error: '客户端不存在' });
    }

    const compose = generateDockerCompose(client);

    res.setHeader('Content-Type', 'text/yaml');
    res.send(compose);
  } catch (error) {
    console.error('生成 docker-compose 失败:', error);
    res.status(500).json({ error: '生成 docker-compose 失败' });
  }
});

export default router;

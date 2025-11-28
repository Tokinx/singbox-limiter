import {
  getExpiredClients,
  getOverLimitClients,
  getClientsNeedingReset,
  updateClient,
  resetClientTraffic,
  addAuditLog
} from '../utils/database.js';
import { stopContainer, startContainer } from './docker-monitor.js';

/**
 * 检查并处理过期的客户端
 */
export async function handleExpiredClients() {
  const expiredClients = getExpiredClients();

  for (const client of expiredClients) {
    console.log(`⚠️  客户端 ${client.name} 已过期，正在停用...`);

    // 停止容器
    if (client.container_name) {
      await stopContainer(client.container_name);
    }

    // 更新状态
    updateClient(client.id, { active: 0 });

    // 记录审计日志
    addAuditLog(
      client.id,
      'AUTO_DISABLE_EXPIRED',
      `客户端已过期，到期时间: ${client.expiry_date}`
    );
  }

  if (expiredClients.length > 0) {
    console.log(`✅ 已处理 ${expiredClients.length} 个过期客户端`);
  }
}

/**
 * 检查并处理流量超限的客户端
 */
export async function handleOverLimitClients() {
  const overLimitClients = getOverLimitClients();

  for (const client of overLimitClients) {
    const usedGB = (client.used_bytes / 1024 / 1024 / 1024).toFixed(2);
    const limitGB = (client.limit_bytes / 1024 / 1024 / 1024).toFixed(2);

    console.log(
      `⚠️  客户端 ${client.name} 流量超限，` +
      `已用: ${usedGB}GB / 限额: ${limitGB}GB，正在停用...`
    );

    // 停止容器
    if (client.container_name) {
      await stopContainer(client.container_name);
    }

    // 更新状态
    updateClient(client.id, { active: 0 });

    // 记录审计日志
    addAuditLog(
      client.id,
      'AUTO_DISABLE_OVER_LIMIT',
      `流量超限，已用: ${usedGB}GB, 限额: ${limitGB}GB`
    );
  }

  if (overLimitClients.length > 0) {
    console.log(`✅ 已处理 ${overLimitClients.length} 个流量超限客户端`);
  }
}

/**
 * 检查并处理需要重置流量的客户端
 */
export async function handleTrafficReset() {
  const clientsNeedingReset = getClientsNeedingReset();

  for (const client of clientsNeedingReset) {
    console.log(`🔄 重置客户端 ${client.name} 的流量...`);

    // 重置流量
    resetClientTraffic(client.id);

    // 如果客户端之前因为流量超限被停用，现在重新启用
    if (!client.active && client.container_name) {
      // 检查是否仅因为流量超限被停用（未过期）
      const isExpired = client.expiry_date && new Date(client.expiry_date) < new Date();

      if (!isExpired) {
        console.log(`✅ 重新启用客户端 ${client.name}`);
        await startContainer(client.container_name);
        updateClient(client.id, { active: 1 });
      }
    }

    // 记录审计日志
    addAuditLog(
      client.id,
      'AUTO_RESET_TRAFFIC',
      `流量已重置，重置日: ${client.reset_day}`
    );
  }

  if (clientsNeedingReset.length > 0) {
    console.log(`✅ 已重置 ${clientsNeedingReset.length} 个客户端的流量`);
  }
}

/**
 * 执行所有定时检查任务
 */
export async function runScheduledChecks() {
  console.log('\n🔍 开始执行定时检查任务...');

  try {
    await handleExpiredClients();
    await handleOverLimitClients();
    await handleTrafficReset();
  } catch (error) {
    console.error('❌ 定时检查任务执行失败:', error);
  }

  console.log('✅ 定时检查任务完成\n');
}

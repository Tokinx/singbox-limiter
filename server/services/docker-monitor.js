import Docker from 'dockerode';
import { updateClientTraffic, getAllClients } from '../utils/database.js';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// 存储上一次的流量数据，用于计算增量
const lastStats = new Map();

/**
 * 获取容器的实时流量统计
 */
async function getContainerStats(containerName) {
  try {
    const container = docker.getContainer(containerName);
    const stats = await container.stats({ stream: false });

    const rxBytes = stats.networks?.eth0?.rx_bytes || 0;
    const txBytes = stats.networks?.eth0?.tx_bytes || 0;

    return {
      download: rxBytes,
      upload: txBytes,
      total: rxBytes + txBytes
    };
  } catch (error) {
    console.error(`❌ 获取容器 ${containerName} 流量失败:`, error.message);
    return null;
  }
}

/**
 * 监控所有客户端容器的流量
 */
export async function monitorAllClientTraffic() {
  const clients = getAllClients();

  for (const client of clients) {
    if (!client.container_name || !client.active) {
      continue;
    }

    try {
      const currentStats = await getContainerStats(client.container_name);

      if (!currentStats) {
        continue;
      }

      // 获取上一次的统计数据
      const lastStat = lastStats.get(client.id) || {
        download: 0,
        upload: 0
      };

      // 计算增量流量（字节）
      const downloadDelta = Math.max(0, currentStats.download - lastStat.download);
      const uploadDelta = Math.max(0, currentStats.upload - lastStat.upload);

      // 如果有流量增量，更新数据库
      if (downloadDelta > 0 || uploadDelta > 0) {
        updateClientTraffic(client.id, uploadDelta, downloadDelta);

        console.log(
          `📊 [${client.name}] 上传: ${formatBytes(uploadDelta)}, ` +
          `下载: ${formatBytes(downloadDelta)}, ` +
          `总计: ${formatBytes(uploadDelta + downloadDelta)}`
        );
      }

      // 更新缓存
      lastStats.set(client.id, {
        download: currentStats.download,
        upload: currentStats.upload
      });
    } catch (error) {
      console.error(`❌ 监控客户端 ${client.name} 失败:`, error.message);
    }
  }
}

/**
 * 检查容器是否正在运行
 */
export async function isContainerRunning(containerName) {
  try {
    const container = docker.getContainer(containerName);
    const info = await container.inspect();
    return info.State.Running;
  } catch (error) {
    return false;
  }
}

/**
 * 启动容器
 */
export async function startContainer(containerName) {
  try {
    const container = docker.getContainer(containerName);
    await container.start();
    console.log(`✅ 容器 ${containerName} 已启动`);
    return true;
  } catch (error) {
    console.error(`❌ 启动容器 ${containerName} 失败:`, error.message);
    return false;
  }
}

/**
 * 停止容器
 */
export async function stopContainer(containerName) {
  try {
    const container = docker.getContainer(containerName);
    await container.stop();
    console.log(`⏸️  容器 ${containerName} 已停止`);
    return true;
  } catch (error) {
    console.error(`❌ 停止容器 ${containerName} 失败:`, error.message);
    return false;
  }
}

/**
 * 删除容器
 */
export async function removeContainer(containerName) {
  try {
    const container = docker.getContainer(containerName);

    // 先停止容器
    const isRunning = await isContainerRunning(containerName);
    if (isRunning) {
      await container.stop();
    }

    // 删除容器
    await container.remove();
    console.log(`🗑️  容器 ${containerName} 已删除`);
    return true;
  } catch (error) {
    console.error(`❌ 删除容器 ${containerName} 失败:`, error.message);
    return false;
  }
}

/**
 * 创建并启动 sing-box 客户端容器
 */
export async function createClientContainer(client) {
  try {
    const container = await docker.createContainer({
      name: client.container_name,
      Image: 'ghcr.io/sagernet/sing-box:latest',
      HostConfig: {
        RestartPolicy: { Name: 'always' },
        NetworkMode: 'bridge',
        PortBindings: {
          [`${client.reality_port}/tcp`]: [{ HostPort: `${client.reality_port}` }],
          [`${client.hysteria_port}/udp`]: [{ HostPort: `${client.hysteria_port}` }]
        },
        Binds: [
          `${process.cwd()}/configs/clients/${client.id}.json:/etc/sing-box/config.json:ro`,
          `${process.cwd()}/certs/server.pem:/etc/sing-box/server.pem:ro`,
          `${process.cwd()}/certs/server.key:/etc/sing-box/server.key:ro`
        ],
        CapAdd: ['NET_RAW']
      },
      Env: ['TZ=Asia/Shanghai'],
      Labels: {
        'bandwidth.monitor': 'true',
        'client.id': client.id
      },
      Cmd: ['-D', '/var/lib/sing-box', '-C', '/etc/sing-box/', 'run']
    });

    await container.start();
    console.log(`✅ 容器 ${client.container_name} 创建并启动成功`);
    return true;
  } catch (error) {
    console.error(`❌ 创建容器 ${client.container_name} 失败:`, error.message);
    return false;
  }
}

/**
 * 格式化字节数
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * 获取所有带有监控标签的容器
 */
export async function getMonitoredContainers() {
  try {
    const containers = await docker.listContainers({
      all: true,
      filters: {
        label: ['bandwidth.monitor=true']
      }
    });

    return containers.map(container => ({
      id: container.Id,
      name: container.Names[0].replace('/', ''),
      state: container.State,
      clientId: container.Labels['client.id']
    }));
  } catch (error) {
    console.error('❌ 获取容器列表失败:', error.message);
    return [];
  }
}

export { formatBytes };

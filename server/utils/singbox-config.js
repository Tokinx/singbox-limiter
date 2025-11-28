import { join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

const CONFIG_DIR = join(process.cwd(), 'configs/clients');

// 确保配置目录存在
if (!existsSync(CONFIG_DIR)) {
  mkdirSync(CONFIG_DIR, { recursive: true });
}

/**
 * 生成 Reality 服务器配置
 */
export function generateRealityConfig(client) {
  return {
    tag: `reality-${client.id}`,
    type: 'vless',
    listen: '::',
    listen_port: client.reality_port,
    users: [
      {
        uuid: client.uuid,
        flow: client.flow
      }
    ],
    tls: {
      enabled: true,
      server_name: client.sni,
      reality: {
        enabled: true,
        handshake: {
          server: client.sni,
          server_port: 443
        },
        private_key: client.private_key,
        short_id: [client.short_id]
      },
      certificate_path: '/etc/sing-box/server.pem',
      key_path: '/etc/sing-box/server.key'
    }
  };
}

/**
 * 生成 Hysteria2 服务器配置
 */
export function generateHysteria2Config(client) {
  return {
    tag: `hysteria2-${client.id}`,
    type: 'hysteria2',
    listen: '::',
    listen_port: client.hysteria_port,
    users: [
      {
        password: client.uuid
      }
    ],
    tls: {
      enabled: true,
      alpn: ['h3'],
      certificate_path: '/etc/sing-box/server.pem',
      key_path: '/etc/sing-box/server.key'
    }
  };
}

/**
 * 生成完整的 sing-box 配置文件
 */
export function generateSingBoxConfig(client) {
  const config = {
    log: {
      level: 'info',
      timestamp: true
    },
    inbounds: [
      generateRealityConfig(client),
      generateHysteria2Config(client)
    ],
    outbounds: [
      {
        type: 'direct',
        tag: 'direct'
      },
      {
        type: 'block',
        tag: 'block'
      }
    ]
  };

  // 保存配置文件
  const configPath = join(CONFIG_DIR, `${client.id}.json`);
  writeFileSync(configPath, JSON.stringify(config, null, 2));

  return { config, configPath };
}

/**
 * 构建 Reality 连接 URL
 */
export function buildRealityUrl(client) {
  const params = new URLSearchParams({
    encryption: 'none',
    flow: client.flow,
    security: 'reality',
    sni: client.sni,
    fp: 'chrome',
    pbk: client.public_key,
    sid: client.short_id,
    type: 'tcp',
    headerType: 'none'
  });

  const url = `vless://${client.uuid}@${client.server_ip}:${client.reality_port}?${params.toString()}#SingBox-Reality-${client.name}`;
  return url;
}

/**
 * 构建 Hysteria2 连接 URL
 */
export function buildHysteria2Url(client) {
  const params = new URLSearchParams({
    insecure: '1',
    sni: client.server_ip
  });

  const url = `hysteria2://${client.uuid}@${client.server_ip}:${client.hysteria_port}?${params.toString()}#SingBox-Hysteria2-${client.name}`;
  return url;
}

/**
 * 生成客户端专用的 docker-compose.yml 内容
 */
export function generateDockerCompose(client) {
  return `version: '3.8'

services:
  ${client.container_name}:
    image: ghcr.io/sagernet/sing-box:latest
    container_name: ${client.container_name}
    restart: always
    network_mode: bridge
    ports:
      - ${client.reality_port}:${client.reality_port}/tcp
      - ${client.hysteria_port}:${client.hysteria_port}/udp
    cap_add:
      - NET_RAW
    volumes:
      - ./configs/clients/${client.id}.json:/etc/sing-box/config.json:ro
      - ./certs/server.pem:/etc/sing-box/server.pem:ro
      - ./certs/server.key:/etc/sing-box/server.key:ro
    environment:
      - TZ=Asia/Shanghai
    labels:
      - "bandwidth.monitor=true"
      - "client.id=${client.id}"
    command: -D /var/lib/sing-box -C /etc/sing-box/ run
`;
}

// 流量历史记录
export interface TrafficHistory {
  timestamp: string;
  upload: number; // bytes
  download: number; // bytes
}

// 客户端接口
export interface Client {
  id: string;
  name: string;
  email: string;
  uuid: string;
  flow: string;
  // 流量限制
  limitBytes: number; // -1 表示无限
  usedBytes: number;
  resetInterval: 'monthly' | 'manual';
  resetDay: number; // 1-31
  expiryDate: string | null; // ISO Date string
  // 状态
  active: boolean;
  // 连接配置
  serverIp: string;
  realityPort: number;
  hysteriaPort: number;
  sni: string;
  publicKey: string;
  shortId: string;
  // 流量历史
  history: TrafficHistory[];
}

// 创建客户端请求
export interface CreateClientRequest {
  name: string;
  email?: string;
  limitBytes?: number;
  expiryDate?: string | null;
  resetInterval?: 'monthly' | 'manual';
  resetDay?: number;
}

// 更新客户端请求
export interface UpdateClientRequest {
  name?: string;
  email?: string;
  limitBytes?: number;
  expiryDate?: string | null;
  resetInterval?: 'monthly' | 'manual';
  resetDay?: number;
  active?: boolean;
}

// 连接 URL 响应
export interface ClientUrls {
  reality: string;
  hysteria2: string;
  shareUrl: string;
}

// 应用状态
export interface AppState {
  clients: Client[];
  view: 'login' | 'dashboard' | 'detail' | 'share';
  activeClientId: string | null;
}

// 主题类型
export type Theme = 'light' | 'dark' | 'auto';

// 格式化字节数
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 B';
  if (bytes === -1) return '∞';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// 格式化日期
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '永久';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

// 生成 Reality URI
export const generateRealityUri = (c: Client): string => {
  return `vless://${c.uuid}@${c.serverIp}:${c.realityPort}?encryption=none&flow=${c.flow}&security=reality&sni=${c.sni}&fp=chrome&pbk=${c.publicKey}&sid=${c.shortId}&type=tcp&headerType=none#${encodeURIComponent(c.name)}`;
};

// 生成 Hysteria2 URI
export const generateHy2Uri = (c: Client): string => {
  return `hysteria2://${c.uuid}@${c.serverIp}:${c.hysteriaPort}?sni=${c.sni}&insecure=1#${encodeURIComponent(c.name)}`;
};

// 计算剩余流量
export const getRemainingBytes = (c: Client): number => {
  if (c.limitBytes === -1) return Infinity;
  return Math.max(0, c.limitBytes - c.usedBytes);
};

// 计算使用百分比
export const getUsagePercent = (c: Client): number => {
  if (c.limitBytes === -1) return 0;
  return Math.min(100, (c.usedBytes / c.limitBytes) * 100);
};

// 检查是否过期
export const isExpired = (c: Client): boolean => {
  if (!c.expiryDate) return false;
  return new Date(c.expiryDate) < new Date();
};

// 检查是否超过流量限制
export const isOverLimit = (c: Client): boolean => {
  if (c.limitBytes === -1) return false;
  return c.usedBytes >= c.limitBytes;
};

// 检查客户端状态是否正常
export const isClientHealthy = (c: Client): boolean => {
  return c.active && !isExpired(c) && !isOverLimit(c);
};

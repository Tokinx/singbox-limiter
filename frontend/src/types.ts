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
  remark: string;
  uuid: string;
  flow: string;
  // 流量限制
  limitBytes: number; // -1 表示无限
  usedBytes: number;
  tempBytes: number; // 临时流量
  resetInterval: 'monthly' | 'manual';
  resetDay: number; // 1-31
  expiryDate: string | null; // ISO Date string
  // 状态
  active: boolean;
  containerRunning?: boolean; // 容器运行状态
  // 连接配置
  serverIp: string;
  realityPort: number;
  hysteriaPort: number;
  sni: string;
  publicKey: string;
  shortId: string;
  obfsPassword?: string; // Hysteria2 混淆密码
  // 流量历史
  history: TrafficHistory[];
}

// 创建客户端请求
export interface CreateClientRequest {
  name: string;
  remark?: string;
  limitGb?: number;
  expiryDate?: string | null;
  resetInterval?: 'monthly' | 'manual';
  resetDay?: number;
  realityPort: number;
  hysteriaPort: number;
  sni?: string;
}

// 更新客户端请求
export interface UpdateClientRequest {
  name?: string;
  remark?: string;
  limitGb?: number;
  tempGb?: number;
  expiryDate?: string | null;
  resetInterval?: 'monthly' | 'manual';
  resetDay?: number;
  realityPort?: number;
  hysteriaPort?: number;
  sni?: string;
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
  if (!dateString) return '长期有效';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

// 格式化完整日期时间
export const formatDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 计算下次重置时间
export const getNextResetTime = (c: Client): Date | null => {
  if (c.resetInterval !== 'monthly') return null;

  const now = new Date();
  const resetDay = Math.min(c.resetDay, 28); // 避免月末问题

  let nextReset = new Date(now.getFullYear(), now.getMonth(), resetDay, 0, 0, 0);

  // 如果当前日期已经过了重置日，则下个月重置
  if (now.getDate() >= resetDay) {
    nextReset.setMonth(nextReset.getMonth() + 1);
  }

  return nextReset;
};

// 生成 Reality URI
export const generateRealityUri = (c: Client): string => {
  return `vless://${c.uuid}@${c.serverIp}:${c.realityPort}?encryption=none&flow=${c.flow}&security=reality&sni=${c.sni}&fp=chrome&pbk=${c.publicKey}&sid=${c.shortId}&type=tcp#${encodeURIComponent(c.name)}`;
};

// 生成 Hysteria2 URI
export const generateHy2Uri = (c: Client): string => {
  const obfsPass = c.obfsPassword || c.uuid; // 兼容旧客户端
  return `hysteria2://${c.uuid}@${c.serverIp}:${c.hysteriaPort}?sni=${c.sni}&insecure=1&obfs=salamander&obfs-password=${obfsPass}#${encodeURIComponent(c.name)}`;
};

// 计算剩余流量（考虑临时流量）
export const getRemainingBytes = (c: Client): number => {
  const totalLimit = c.limitBytes === -1 ? Infinity : c.limitBytes + (c.tempBytes || 0);
  if (totalLimit === Infinity) return Infinity;
  return Math.max(0, totalLimit - c.usedBytes);
};

// 计算使用百分比（考虑临时流量）
export const getUsagePercent = (c: Client): number => {
  const totalLimit = c.limitBytes === -1 ? -1 : c.limitBytes + (c.tempBytes || 0);
  if (totalLimit === -1) return 0;
  return Math.min(100, (c.usedBytes / totalLimit) * 100);
};

// 获取总流量限制（基础 + 临时）
export const getTotalLimitBytes = (c: Client): number => {
  if (c.limitBytes === -1) return -1;
  return c.limitBytes + (c.tempBytes || 0);
};

// 检查是否过期
export const isExpired = (c: Client): boolean => {
  if (!c.expiryDate) return false;
  return new Date(c.expiryDate) < new Date();
};

// 检查是否超过流量限制（考虑临时流量）
export const isOverLimit = (c: Client): boolean => {
  const totalLimit = getTotalLimitBytes(c);
  if (totalLimit === -1) return false;
  return c.usedBytes >= totalLimit;
};

// 检查客户端状态是否正常
export const isClientHealthy = (c: Client): boolean => {
  return c.active && !isExpired(c) && !isOverLimit(c);
};

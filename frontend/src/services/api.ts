import type { Client, CreateClientRequest, UpdateClientRequest, ClientUrls, TrafficHistory } from '../types';

const API_BASE = '/api';

// Token 管理
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const clearToken = (): void => {
  localStorage.removeItem('token');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// 通用请求函数
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !url.includes('/auth/login')) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('未授权，请重新登录');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
}

// 认证 API
export const authApi = {
  login: async (username: string, password: string): Promise<{ token: string }> => {
    const data = await request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    return data;
  },

  logout: (): void => {
    clearToken();
  },
};

// 客户端 API
export const clientApi = {
  // 获取所有客户端
  getAll: (): Promise<Client[]> => request<Client[]>('/clients'),

  // 获取单个客户端
  get: (id: string): Promise<Client> => request<Client>(`/clients/${id}`),

  // 创建客户端
  create: async (data: CreateClientRequest): Promise<Client> => {
    const response = await request<{ success: boolean; client: Client }>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.client;
  },

  // 更新客户端
  update: async (id: string, data: UpdateClientRequest): Promise<{ success: boolean; client: Client }> => {
    const response = await request<{ success: boolean; client: Client }>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response;
  },

  // 删除客户端
  delete: (id: string): Promise<void> =>
    request<void>(`/clients/${id}`, {
      method: 'DELETE',
    }),

  // 获取流量历史
  getTraffic: (id: string, hours = 24): Promise<TrafficHistory[]> =>
    request<TrafficHistory[]>(`/clients/${id}/traffic?hours=${hours}`),

  // 重置流量
  resetTraffic: (id: string): Promise<void> =>
    request<void>(`/clients/${id}/reset-traffic`, {
      method: 'POST',
    }),

  // 获取连接 URLs
  getUrls: (id: string): Promise<ClientUrls> =>
    request<ClientUrls>(`/clients/${id}/urls`),

  // 切换启用/禁用状态
  toggleActive: async (id: string, active: boolean): Promise<Client> => {
    const response = await request<{ success: boolean; client: Client }>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ active }),
    });
    return response.client;
  },
};

// 分享页面 API
export const shareApi = {
  getData: (token: string): Promise<{
    client: Client;
    urls: ClientUrls;
  }> => request<{ client: Client; urls: ClientUrls }>(`/share/${token}`),
};

// 复制到剪贴板
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
};

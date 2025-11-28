// API 基础地址
const API_BASE = '/api';

// 获取 Token
export function getToken() {
  return localStorage.getItem('token');
}

// 设置 Token
export function setToken(token) {
  localStorage.setItem('token', token);
}

// 清除 Token
export function clearToken() {
  localStorage.removeItem('token');
}

// 通用请求函数
async function request(url, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token && !url.includes('/auth/login')) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = '/';
    throw new Error('未授权，请重新登录');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
}

// API 方法
export const api = {
  // 认证
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  // 客户端
  getClients: () => request('/clients'),

  getClient: (id) => request(`/clients/${id}`),

  createClient: (data) =>
    request('/clients', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateClient: (id, data) =>
    request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteClient: (id) =>
    request(`/clients/${id}`, {
      method: 'DELETE'
    }),

  getTraffic: (id, hours = 24) =>
    request(`/clients/${id}/traffic?hours=${hours}`),

  resetTraffic: (id) =>
    request(`/clients/${id}/reset-traffic`, {
      method: 'POST'
    }),

  getUrls: (id) => request(`/clients/${id}/urls`),

  // 分享页面
  getShareData: (token) => request(`/share/${token}`)
};

// 格式化字节数
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// 格式化日期
export function formatDate(dateString) {
  if (!dateString) return '长期有效';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
}

// 复制到剪贴板
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
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
}

// Toast 提示
export function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) {
    const div = document.createElement('div');
    div.id = 'toast';
    div.className = 'toast';
    div.textContent = message;
    document.body.appendChild(div);

    setTimeout(() => {
      div.remove();
    }, duration);
  } else {
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, duration);
  }
}

// 确认对话框
export function confirm(message) {
  return window.confirm(message);
}

export type Language = 'zh' | 'en';

const translations = {
  zh: {
    // 通用
    appName: 'SingBox 流量管理',
    dashboard: '仪表盘',
    back: '返回',
    cancel: '取消',
    confirm: '确认',
    create: '创建',
    save: '保存',
    delete: '删除',
    copy: '复制',
    copied: '已复制',
    loading: '加载中...',

    // 登录
    login: '登录',
    logout: '登出',
    username: '用户名',
    password: '密码',
    loginTitle: '管理员登录',
    loginDesc: 'SingBox 流量管理系统',
    loginError: '用户名或密码错误',

    // 客户端列表
    activeClients: '客户端列表',
    manageDesc: '管理 SingBox 用户、流量限制和协议连接信息。',
    newClient: '新建客户端',
    noClients: '暂无客户端',
    noClientsDesc: '点击上方按钮创建第一个客户端',

    // 客户端状态
    active: '活跃',
    stopped: '已停用',
    expired: '已过期',
    overLimit: '已超限',

    // 流量相关
    usage: '已用',
    remaining: '剩余',
    limit: '总额',
    unlimited: '无限',
    resetTraffic: '重置流量',
    trafficHistory: '流量历史 (24h)',

    // 时间相关
    expires: '到期时间',
    never: '长期有效',
    nextReset: '下次重置',
    day: '日',
    manual: '手动',
    monthly: '每月',

    // 客户端详情
    sharePage: '分享页面',
    disable: '禁用',
    enable: '启用',
    protocols: '连接协议',
    serverConfig: '服务器配置',

    // 创建/编辑客户端
    clientName: '客户端名称',
    clientRemark: '备注 (可选)',
    trafficLimit: '流量上限 (GB)',
    trafficLimitDesc: '0 表示无限流量',
    tempTraffic: '临时流量 (GB)',
    tempTrafficDesc: '仅在本周期内有效，重置后清空',
    expiryDate: '到期时间 (可选)',
    resetDay: '每月重置日 (1-31)',
    realityPort: 'Reality 端口',
    hysteriaPort: 'Hysteria2 端口',
    sni: 'SNI 域名',
    editClient: '编辑客户端',

    // 确认对话框
    deleteConfirm: '确定要删除此客户端吗？此操作无法撤销。',
    resetConfirm: '确定要重置此客户端的流量吗？',
    logoutConfirm: '确定要退出登录吗？',

    // 成功消息
    copySuccess: '复制成功',
    deleteSuccess: '客户端已删除',
    updateSuccess: '更新成功',
    createSuccess: '客户端创建成功',
    shareSuccess: '分享链接已复制',
    resetSuccess: '流量已重置',

    // 分享页面
    secureLink: '安全链接 · 禁止公开分享',
    serviceStatus: '服务状态',
    dataUsed: '已用流量',
    resetCycle: '重置周期',
    subscription: '订阅状态',
    poweredBy: '由 SingBox Limiter 提供支持',

    // 主题
    theme: '主题',
    light: '浅色',
    dark: '深色',
    auto: '自动',

    // 语言
    language: '语言',

    // 版权
    copyright: '© 2024 SingBox Limiter. 保留所有权利。',
    github: 'GitHub',

    // 错误
    error: '错误',
    networkError: '网络错误，请稍后重试',
    unauthorized: '未授权，请重新登录',
  },
  en: {
    // General
    appName: 'SingBox Limiter',
    dashboard: 'Dashboard',
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    create: 'Create',
    save: 'Save',
    delete: 'Delete',
    copy: 'Copy',
    copied: 'Copied',
    loading: 'Loading...',

    // Login
    login: 'Login',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    loginTitle: 'Admin Login',
    loginDesc: 'SingBox Traffic Management System',
    loginError: 'Invalid username or password',

    // Client List
    activeClients: 'Client List',
    manageDesc: 'Manage sing-box users, limits, and protocols.',
    newClient: 'New Client',
    noClients: 'No clients yet',
    noClientsDesc: 'Click the button above to create your first client',

    // Client Status
    active: 'Active',
    stopped: 'Stopped',
    expired: 'Expired',
    overLimit: 'Over Limit',

    // Traffic
    usage: 'Used',
    remaining: 'Remaining',
    limit: 'Limit',
    unlimited: 'Unlimited',
    resetTraffic: 'Reset Traffic',
    trafficHistory: 'Traffic History (24h)',

    // Time
    expires: 'Expiry Time',
    never: 'Long-term Validity',
    nextReset: 'Next Reset',
    day: 'Day',
    manual: 'Manual',
    monthly: 'Monthly',

    // Client Detail
    sharePage: 'Share Page',
    disable: 'Disable',
    enable: 'Enable',
    protocols: 'Connection Protocols',
    serverConfig: 'Server Config',

    // Create/Edit Client
    clientName: 'Client Name',
    clientRemark: 'Remark (Optional)',
    trafficLimit: 'Traffic Limit (GB)',
    trafficLimitDesc: '0 for unlimited',
    tempTraffic: 'Temporary Traffic (GB)',
    tempTrafficDesc: 'Only valid for current cycle, cleared after reset',
    expiryDate: 'Expiry Date (Optional)',
    resetDay: 'Reset Day (1-31)',
    realityPort: 'Reality Port',
    hysteriaPort: 'Hysteria2 Port',
    sni: 'SNI Domain',
    editClient: 'Edit Client',

    // Confirmation Dialogs
    deleteConfirm: 'Delete this client? This cannot be undone.',
    resetConfirm: 'Reset traffic usage for this client?',
    logoutConfirm: 'Are you sure you want to logout?',

    // Success Messages
    copySuccess: 'Copied to clipboard',
    deleteSuccess: 'Client deleted',
    updateSuccess: 'Updated successfully',
    createSuccess: 'Client created successfully',
    shareSuccess: 'Share link copied',
    resetSuccess: 'Traffic reset successfully',

    // Share Page
    secureLink: 'SECURE LINK · DO NOT SHARE PUBLICLY',
    serviceStatus: 'Service Status',
    dataUsed: 'Data Used',
    resetCycle: 'Reset Cycle',
    subscription: 'Subscription',
    poweredBy: 'Powered by SingBox Limiter',

    // Theme
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto',

    // Language
    language: 'Language',

    // Copyright
    copyright: '© 2024 SingBox Limiter. All rights reserved.',
    github: 'GitHub',

    // Errors
    error: 'Error',
    networkError: 'Network error, please try again',
    unauthorized: 'Unauthorized, please login again',
  },
};

export type TranslationKey = keyof typeof translations['zh'];

export const t = (key: TranslationKey, lang: Language): string => {
  return translations[lang][key] || translations['en'][key] || key;
};

// 获取浏览器默认语言
export const getBrowserLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en';
};

// 从本地存储获取语言设置
export const getStoredLanguage = (): Language => {
  const stored = localStorage.getItem('language');
  if (stored === 'zh' || stored === 'en') return stored;
  return getBrowserLanguage();
};

// 保存语言设置到本地存储
export const setStoredLanguage = (lang: Language): void => {
  localStorage.setItem('language', lang);
};

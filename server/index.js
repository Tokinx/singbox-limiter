import express from 'express';
import cors from 'cors';
import { CronJob } from 'cron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 导入路由
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import shareRoutes from './routes/share.js';

// 导入中间件
import { authMiddleware } from './middleware/auth.js';

// 导入服务
import { initDatabase } from './utils/database.js';
import { generateSelfSignedCert } from './utils/cert-generator.js';
import { monitorAllClientTraffic } from './services/docker-monitor.js';
import { runScheduledChecks } from './services/limiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 初始化
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(join(__dirname, '../public')));

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API 路由（应用认证中间件）
app.use('/api/auth', authRoutes);
app.use('/api/share', shareRoutes); // 分享页面公开访问
app.use(authMiddleware); // 以下路由需要认证
app.use('/api/clients', clientRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 初始化应用
async function initApp() {
  console.log('\n🚀 SingBox Limiter 正在启动...\n');

  // 1. 初始化数据库
  console.log('📦 初始化数据库...');
  initDatabase();

  // 2. 生成自签名证书
  console.log('🔐 检查 SSL 证书...');
  try {
    generateSelfSignedCert();
  } catch (error) {
    console.error('⚠️  证书生成失败，请手动运行: npm run init-cert');
  }

  // 3. 启动定时任务
  const MONITOR_INTERVAL = parseInt(process.env.TRAFFIC_MONITOR_INTERVAL) || 60;

  console.log(`⏰ 设置定时任务 (流量监控间隔: ${MONITOR_INTERVAL}秒)...`);

  // 流量监控任务 (每 N 秒执行一次)
  setInterval(async () => {
    try {
      await monitorAllClientTraffic();
    } catch (error) {
      console.error('流量监控任务失败:', error);
    }
  }, MONITOR_INTERVAL * 1000);

  // 定时检查任务 (每 5 分钟执行一次)
  new CronJob('*/5 * * * *', async () => {
    try {
      await runScheduledChecks();
    } catch (error) {
      console.error('定时检查任务失败:', error);
    }
  }, null, true);

  // 4. 启动服务器
  app.listen(PORT, HOST, () => {
    console.log('\n✅ 服务器启动成功！\n');
    console.log(`📍 监听地址: http://${HOST}:${PORT}`);
    console.log(`📍 健康检查: http://${HOST}:${PORT}/health`);
    console.log(`📍 API 文档: http://${HOST}:${PORT}/api`);
    console.log('\n💡 默认管理员账号:');
    console.log(`   用户名: ${process.env.ADMIN_USERNAME || 'admin'}`);
    console.log(`   密码: ${process.env.ADMIN_PASSWORD || 'admin'}`);
    console.log('\n⚠️  请立即修改默认密码！\n');
  });
}

// 优雅退出
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});

// 启动应用
initApp().catch(error => {
  console.error('❌ 应用启动失败:', error);
  process.exit(1);
});

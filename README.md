# SingBox Limiter

基于 Docker 部署的 SingBox 客户端管理系统，支持流量限制、到期管理和实时监控。

## 功能特性

✅ **客户端管理**
- 通过 Web 界面创建/编辑/删除客户端
- 支持 Reality + Hysteria2 双协议
- 自动生成配置文件和 Docker 容器

✅ **流量控制**
- 设置流量上限（支持无限流量）
- 实时监控容器网络流量
- 自动停用超限客户端
- 灵活的流量重置规则（月度/自定义）

✅ **到期管理**
- 设置客户端到期时间
- 自动停用过期客户端
- 审计日志记录

✅ **流量统计**
- 24小时流量趋势图表
- 上传/下载分离统计
- 历史记录查询

✅ **分享页面**
- 生成独立分享链接
- 展示流量使用情况和到期信息
- 一键复制连接 URL
- 防爬虫/搜索引擎索引

## 快速开始

### 1. 环境要求

- Node.js 18+
- Docker + Docker Compose
- Linux 服务器（支持 Docker Socket）

### 2. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 3. 配置环境变量

\`\`\`bash
cp .env.example .env
\`\`\`

编辑 `.env` 文件：

\`\`\`env
# 管理员账号（务必修改）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# JWT 密钥（务必修改）
JWT_SECRET=your_random_secret_key

# 服务器配置
PORT=3000
SERVER_IP=你的服务器公网IP

# 流量监控间隔（秒）
TRAFFIC_MONITOR_INTERVAL=60
\`\`\`

### 4. 生成 SSL 证书

\`\`\`bash
npm run init-cert
\`\`\`

### 5. 启动服务

\`\`\`bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm start
\`\`\`

服务器将在 `http://0.0.0.0:3000` 启动。

## API 文档

### 认证 API

#### POST /api/auth/login
管理员登录

\`\`\`json
{
  "username": "admin",
  "password": "your_password"
}
\`\`\`

响应：
\`\`\`json
{
  "success": true,
  "token": "jwt_token",
  "username": "admin"
}
\`\`\`

### 客户端 API

所有客户端 API 需要在 Header 中携带 Token：
\`\`\`
Authorization: Bearer <token>
\`\`\`

#### GET /api/clients
获取所有客户端列表

#### POST /api/clients
创建新客户端

\`\`\`json
{
  "name": "客户端名称",
  "email": "user@example.com",
  "limitGb": 10,
  "resetDay": 1,
  "expiryDate": "2024-12-31",
  "realityPort": 20443,
  "hysteriaPort": 20080,
  "sni": "www.google.com"
}
\`\`\`

#### PUT /api/clients/:id
更新客户端配置

#### DELETE /api/clients/:id
删除客户端

#### GET /api/clients/:id/traffic?hours=24
获取流量历史（默认 24 小时）

#### POST /api/clients/:id/reset-traffic
手动重置流量

#### GET /api/clients/:id/urls
获取连接 URL（Reality + Hysteria2）

### 分享页面 API

#### GET /api/share/:token
获取分享页面数据（公开访问，无需认证）

## 工作原理

### 流量监控

1. 通过 Docker API 读取容器的 `network stats`
2. 每隔 N 秒（可配置）计算流量增量
3. 将增量数据写入 SQLite 数据库
4. 累加到客户端总流量

### 流量限制

1. 定时任务（每 5 分钟）检查所有客户端
2. 如果 `used_bytes >= limit_bytes`，自动停用容器
3. 支持手动重置或月度自动重置

### 容器管理

每个客户端对应一个独立的 sing-box 容器：

- 容器名称：`singbox-client-{id}`
- 标签：`bandwidth.monitor=true`
- 配置文件：`configs/clients/{id}.json`
- 端口映射：Reality + Hysteria2

## 目录结构

\`\`\`
singbox-limiter/
├── server/
│   ├── index.js              # 主服务器
│   ├── routes/               # API 路由
│   │   ├── auth.js
│   │   ├── clients.js
│   │   └── share.js
│   ├── middleware/           # 中间件
│   │   └── auth.js
│   ├── services/             # 核心服务
│   │   ├── docker-monitor.js # Docker 流量监控
│   │   └── limiter.js        # 流量限制逻辑
│   └── utils/                # 工具函数
│       ├── database.js       # SQLite 操作
│       ├── cert-generator.js # 证书生成
│       └── singbox-config.js # 配置生成
├── data/                     # SQLite 数据库
├── certs/                    # SSL 证书
├── configs/clients/          # 客户端配置
├── public/                   # 前端静态文件
├── package.json
└── .env
\`\`\`

## Docker 部署

TODO: 后续提供完整的 Dockerfile 和 docker-compose.yml

## 常见问题

### 1. 流量监控不准确？

- 确保 Docker Socket 可访问：`/var/run/docker.sock`
- 检查容器标签：`bandwidth.monitor=true`
- 查看日志中的流量更新信息

### 2. 容器创建失败？

- 检查端口是否被占用
- 确保证书文件已生成：`npm run init-cert`
- 验证 Docker 镜像是否拉取成功

### 3. 无法登录管理后台？

- 检查 `.env` 中的管理员账号
- 确认 JWT_SECRET 已设置

## 安全建议

⚠️ **生产环境部署前务必：**

1. 修改默认管理员密码
2. 使用强随机 JWT_SECRET
3. 配置反向代理（Nginx + HTTPS）
4. 限制 API 访问频率
5. 定期备份 SQLite 数据库

## License

MIT

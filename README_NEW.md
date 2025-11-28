# SingBox Limiter

<div align="center">

![Build Status](https://github.com/YOUR_USERNAME/singbox-limiter/workflows/CI%20Tests/badge.svg)
![Docker](https://github.com/YOUR_USERNAME/singbox-limiter/workflows/Build%20and%20Push%20Docker%20Image/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**基于 Docker 的 SingBox 客户端管理系统**

支持流量限制 | 实时监控 | 到期管理 | Reality + Hysteria2

[功能特性](#功能特性) • [快速开始](#快速开始) • [部署指南](#部署) • [文档](#文档) • [贡献](#贡献)

</div>

---

## 🌟 功能特性

### 核心功能
- ✅ **客户端管理** - 通过 Web 界面创建/编辑/删除客户端
- ✅ **双协议支持** - Reality + Hysteria2 自动配置
- ✅ **实时流量监控** - 通过 Docker API 实时采集容器流量
- ✅ **流量限制** - 自动停用超限客户端
- ✅ **到期管理** - 自动停用过期客户端
- ✅ **流量重置** - 灵活的月度流量重置规则
- ✅ **分享页面** - 独立的客户端信息分享链接
- ✅ **流量趋势** - 24 小时流量图表分析

### 技术亮点
- 🚀 **纯 JavaScript** - 无 TypeScript，降低学习成本
- 🐳 **Docker 原生** - 完整的容器生命周期管理
- 📊 **实时图表** - Chart.js 流量趋势可视化
- 🔐 **JWT 认证** - 安全的 API 访问控制
- 🛡️ **频率限制** - 防止 API 滥用
- 📦 **SQLite** - 轻量级数据库，易于备份
- 🎨 **现代 UI** - 响应式设计，支持移动端

---

## 📸 界面预览

### 登录页面
<img src="https://via.placeholder.com/800x400?text=Login+Page" width="100%" />

### 控制面板
<img src="https://via.placeholder.com/800x400?text=Dashboard" width="100%" />

### 客户端详情
<img src="https://via.placeholder.com/800x400?text=Client+Detail" width="100%" />

---

## 🚀 快速开始

### 前置要求

- Node.js 18+
- Docker & Docker Compose
- Linux 服务器（支持 Docker Socket）

### 方式一：Docker Compose（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/YOUR_USERNAME/singbox-limiter.git
cd singbox-limiter

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 修改以下配置：
# - ADMIN_PASSWORD（必须修改）
# - JWT_SECRET（必须修改）
# - SERVER_IP（填写服务器公网 IP）

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

访问 `http://YOUR_SERVER_IP:3000`

默认账号：`admin` / `admin`（首次登录后请立即修改）

### 方式二：本地开发

```bash
# 1. 安装依赖
npm install
cd frontend && npm install && cd ..

# 2. 生成证书
npm run init-cert

# 3. 配置环境变量
cp .env.example .env

# 4. 构建前端
cd frontend && npm run build && cd ..

# 5. 启动后端
npm run dev
```

---

## 📦 部署

### 使用预构建镜像

```bash
docker pull ghcr.io/YOUR_USERNAME/singbox-limiter:latest

docker run -d \
  --name singbox-limiter \
  --restart always \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/certs:/app/certs \
  -v $(pwd)/configs:/app/configs \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=your_password \
  -e JWT_SECRET=your_secret \
  -e SERVER_IP=YOUR_SERVER_IP \
  ghcr.io/YOUR_USERNAME/singbox-limiter:latest
```

### 配置反向代理

#### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Caddy

```caddyfile
your-domain.com {
    reverse_proxy localhost:3000
}
```

详细部署文档：[DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📚 文档

- [开发指南](DEVELOPMENT.md) - 架构设计和开发指南
- [部署指南](DEPLOYMENT.md) - Docker 部署详细步骤
- [项目状态](PROJECT_STATUS.md) - 功能完成情况

---

## 🔧 技术栈

### 后端
- **运行时**: Node.js 18+
- **框架**: Express.js
- **数据库**: SQLite (better-sqlite3)
- **认证**: JWT + bcryptjs
- **容器管理**: Dockerode
- **定时任务**: node-cron

### 前端
- **构建工具**: Vite
- **图表**: Chart.js
- **样式**: 纯 CSS（无框架）
- **语言**: 纯 JavaScript（无 TypeScript）

---

## 📊 API 端点

### 认证
- `POST /api/auth/login` - 管理员登录

### 客户端管理（需要认证）
- `GET /api/clients` - 获取客户端列表
- `POST /api/clients` - 创建客户端
- `GET /api/clients/:id` - 获取详情
- `PUT /api/clients/:id` - 更新配置
- `DELETE /api/clients/:id` - 删除客户端
- `GET /api/clients/:id/traffic` - 获取流量历史
- `POST /api/clients/:id/reset-traffic` - 重置流量
- `GET /api/clients/:id/urls` - 获取连接 URL

### 分享页面（公开）
- `GET /api/share/:token` - 获取分享数据

---

## 🔐 安全建议

⚠️ **生产环境部署前务必：**

1. ✅ 修改默认管理员密码
2. ✅ 使用强随机 JWT_SECRET（至少 32 位）
3. ✅ 配置 HTTPS 反向代理
4. ✅ 限制 Docker Socket 访问权限
5. ✅ 定期备份 SQLite 数据库
6. ✅ 使用防火墙限制端口访问

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 发起 Pull Request

### 代码规范

- 使用纯 JavaScript（不使用 TypeScript）
- 遵循项目现有代码风格
- 提交前测试所有功能

---

## 📝 TODO

- [ ] 多管理员支持
- [ ] 批量操作功能
- [ ] WebSocket 实时推送
- [ ] 邮件/Webhook 通知
- [ ] 数据导出功能
- [ ] 国际化支持
- [ ] 移动端 APP

---

## 📄 License

本项目采用 [MIT License](LICENSE) 开源协议。

---

## 🙏 致谢

- [sing-box](https://github.com/SagerNet/sing-box) - 核心代理软件
- [Express.js](https://expressjs.com/) - 后端框架
- [Chart.js](https://www.chartjs.org/) - 图表库
- [Dockerode](https://github.com/apocas/dockerode) - Docker API 客户端

---

<div align="center">

**如果觉得这个项目有帮助，请给个 ⭐ Star！**

[Report Bug](https://github.com/YOUR_USERNAME/singbox-limiter/issues) • [Request Feature](https://github.com/YOUR_USERNAME/singbox-limiter/issues)

Made with ❤️ by [Your Name]

</div>

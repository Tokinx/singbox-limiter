# 开发指南

## 项目结构

```
singbox-limiter/
├── server/                   # 后端代码
│   ├── index.js             # 主服务器入口
│   ├── routes/              # API 路由
│   │   ├── auth.js          # 认证接口
│   │   ├── clients.js       # 客户端管理
│   │   └── share.js         # 分享页面
│   ├── middleware/          # 中间件
│   │   └── auth.js          # JWT 认证
│   ├── services/            # 核心服务
│   │   ├── docker-monitor.js # Docker 流量监控
│   │   └── limiter.js        # 流量限制逻辑
│   └── utils/               # 工具函数
│       ├── database.js       # SQLite 数据库
│       ├── cert-generator.js # 证书生成
│       └── singbox-config.js # 配置生成
├── data/                     # 数据目录
│   └── singbox.db           # SQLite 数据库（自动创建）
├── certs/                    # 证书目录
│   ├── server.pem           # SSL 证书（自动生成）
│   └── server.key           # 私钥（自动生成）
├── configs/clients/          # 客户端配置目录
│   └── client-*.json        # 每个客户端的配置文件
├── public/                   # 静态文件
│   └── index.html           # API 文档页面
├── package.json
├── .env.example             # 环境变量模板
└── README.md
```

## 开发流程

### 1. 初始化环境

```bash
# 克隆项目
git clone <repo-url>
cd singbox-limiter

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
vim .env  # 编辑配置
```

### 2. 配置说明

`.env` 文件配置项：

```env
# 管理员账号（必须修改）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# JWT 密钥（必须修改，建议使用随机字符串）
JWT_SECRET=your_random_secret_key_at_least_32_chars

# 服务器配置
PORT=3000                     # API 服务端口
HOST=0.0.0.0                  # 监听地址
SERVER_IP=1.2.3.4             # 服务器公网 IP（用于生成连接 URL）

# sing-box 配置
DEFAULT_SNI=www.google.com    # 默认 SNI

# 流量监控间隔（秒）
TRAFFIC_MONITOR_INTERVAL=60   # 每 60 秒读取一次容器流量

# 数据库路径（可选）
DB_PATH=./data/singbox.db
```

### 3. 生成证书

```bash
npm run init-cert
```

这会在 `certs/` 目录生成自签名证书，供 sing-box 使用。

### 4. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm start
```

访问 `http://localhost:3000` 查看 API 文档。

## 数据库设计

### clients 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 客户端 ID（主键）|
| name | TEXT | 客户端名称 |
| email | TEXT | 邮箱 |
| uuid | TEXT | UUID（用于连接） |
| flow | TEXT | 流控类型（默认 xtls-rprx-vision）|
| limit_bytes | INTEGER | 流量上限（-1 表示无限制）|
| used_bytes | INTEGER | 已用流量 |
| reset_interval | TEXT | 重置间隔（monthly）|
| reset_day | INTEGER | 重置日期（1-31）|
| last_reset_date | TEXT | 上次重置时间 |
| expiry_date | TEXT | 到期时间 |
| active | INTEGER | 是否启用（1/0）|
| server_ip | TEXT | 服务器 IP |
| reality_port | INTEGER | Reality 端口 |
| hysteria_port | INTEGER | Hysteria2 端口 |
| sni | TEXT | SNI |
| public_key | TEXT | Reality 公钥 |
| private_key | TEXT | Reality 私钥 |
| short_id | TEXT | Reality ShortID |
| container_name | TEXT | Docker 容器名称 |
| share_token | TEXT | 分享页面 Token |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

### traffic_history 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 自增 ID |
| client_id | TEXT | 客户端 ID（外键）|
| upload_bytes | INTEGER | 上传流量 |
| download_bytes | INTEGER | 下载流量 |
| total_bytes | INTEGER | 总流量 |
| timestamp | TEXT | 时间戳 |

## API 开发规范

### 认证流程

1. 客户端调用 `/api/auth/login` 获取 JWT Token
2. 后续请求在 Header 中携带 Token：
   ```
   Authorization: Bearer <token>
   ```
3. 服务器通过 `authMiddleware` 验证 Token

### 错误处理

统一返回格式：

```json
{
  "error": "错误信息"
}
```

HTTP 状态码：
- 200: 成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未授权
- 404: 资源不存在
- 500: 服务器错误

## 流量监控原理

### Docker API 集成

使用 `dockerode` 库读取容器网络统计：

```javascript
const stats = await container.stats({ stream: false });
const rxBytes = stats.networks?.eth0?.rx_bytes || 0;
const txBytes = stats.networks?.eth0?.tx_bytes || 0;
```

### 增量计算

- 每次读取流量时，与上次记录对比
- 计算增量：`delta = current - last`
- 累加到数据库

### 定时任务

- **流量监控**：每 N 秒执行一次（可配置）
- **限制检查**：每 5 分钟执行一次
  - 检查过期客户端
  - 检查流量超限客户端
  - 检查需要重置流量的客户端

## 容器生命周期

### 创建客户端

1. 生成 UUID、密钥、配置文件
2. 写入数据库
3. 生成 `configs/clients/{id}.json`
4. 调用 Docker API 创建容器
5. 启动容器

### 停用客户端

1. 调用 `docker.stop(containerName)`
2. 更新数据库 `active = 0`

### 删除客户端

1. 停止并删除容器
2. 删除配置文件
3. 删除数据库记录（级联删除流量历史）

## 测试建议

### 单元测试

TODO: 添加 Jest 测试框架

### 手动测试

1. 使用 Postman 测试 API
2. 创建测试客户端
3. 观察流量监控日志
4. 验证流量限制逻辑

### 集成测试

1. 部署真实 sing-box 容器
2. 使用客户端连接并产生流量
3. 验证流量统计准确性

## 常见问题

### Q: 流量监控不工作？

**A:** 检查以下几点：
1. Docker Socket 权限：确保服务有权访问 `/var/run/docker.sock`
2. 容器标签：确保容器有 `bandwidth.monitor=true` 标签
3. 网络模式：确保容器使用 `bridge` 网络模式
4. 查看日志中的错误信息

### Q: 证书生成失败？

**A:** 确保系统已安装 OpenSSL：
```bash
# Ubuntu/Debian
sudo apt-get install openssl

# CentOS/RHEL
sudo yum install openssl
```

### Q: 端口冲突？

**A:** 修改客户端的 `realityPort` 和 `hysteriaPort`，确保不与其他服务冲突。

## 生产部署

### Docker 部署（推荐）

TODO: 提供 Dockerfile

### 反向代理配置

使用 Nginx 配置 HTTPS：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

### 系统服务配置

创建 systemd 服务 `/etc/systemd/system/singbox-limiter.service`：

```ini
[Unit]
Description=SingBox Limiter
After=network.target docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/singbox-limiter
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable singbox-limiter
sudo systemctl start singbox-limiter
```

## 安全加固

1. **修改默认密码**
2. **使用强随机 JWT_SECRET**
3. **配置 HTTPS**
4. **限制 API 访问频率**（TODO: 添加 rate-limiting）
5. **定期备份数据库**
6. **使用防火墙限制端口访问**
7. **Docker Socket 权限控制**

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支
3. 提交代码
4. 发起 Pull Request

## License

MIT

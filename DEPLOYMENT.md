# Docker 部署指南

## 方式一：使用 Docker Compose（推荐）

### 1. 准备环境

```bash
# 创建项目目录
mkdir -p ~/singbox-limiter
cd ~/singbox-limiter

# 下载项目文件
# (或者 git clone)
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
cat > .env << EOF
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
JWT_SECRET=$(openssl rand -base64 32)
SERVER_IP=YOUR_SERVER_PUBLIC_IP
TRAFFIC_MONITOR_INTERVAL=60
EOF
```

⚠️ **重要：请修改以下配置**
- `ADMIN_PASSWORD`: 设置强密码
- `SERVER_IP`: 填写你的服务器公网 IP

### 3. 生成证书

```bash
# 创建证书目录
mkdir -p certs

# 生成自签名证书
docker run --rm -v $(pwd)/certs:/certs alpine/openssl \
  req -x509 -newkey rsa:4096 -sha256 -days 3650 \
  -nodes -keyout /certs/server.key -out /certs/server.pem \
  -subj "/CN=singbox-limiter" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

### 4. 启动服务

```bash
docker-compose up -d
```

### 5. 查看日志

```bash
docker-compose logs -f singbox-limiter
```

### 6. 访问服务

打开浏览器访问：`http://YOUR_SERVER_IP:3000`

## 方式二：手动 Docker 运行

```bash
# 构建镜像
docker build -t singbox-limiter .

# 运行容器
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
  singbox-limiter
```

## 管理命令

### 查看日志
```bash
docker-compose logs -f
```

### 重启服务
```bash
docker-compose restart
```

### 停止服务
```bash
docker-compose down
```

### 更新服务
```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

### 备份数据
```bash
# 备份数据库
cp data/singbox.db data/singbox.db.backup

# 或者打包整个 data 目录
tar -czf singbox-backup-$(date +%Y%m%d).tar.gz data/ configs/
```

## 反向代理配置

### Nginx

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
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

重启 Nginx：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Caddy

```caddyfile
your-domain.com {
    reverse_proxy localhost:3000
}
```

重启 Caddy：
```bash
sudo systemctl reload caddy
```

## 故障排查

### 1. 容器无法启动

检查日志：
```bash
docker-compose logs singbox-limiter
```

常见问题：
- 端口被占用：修改 `docker-compose.yml` 中的端口映射
- 权限不足：确保当前用户在 docker 组中
- Docker Socket 权限：`ls -la /var/run/docker.sock`

### 2. 无法监控流量

检查 Docker Socket 挂载：
```bash
docker exec singbox-limiter ls -la /var/run/docker.sock
```

确保容器有权限访问 Docker API：
```bash
# 如果权限不足，可以修改 Socket 权限（不推荐生产环境）
sudo chmod 666 /var/run/docker.sock
```

### 3. 客户端容器创建失败

检查：
- 端口是否冲突
- 证书文件是否存在
- sing-box 镜像是否拉取成功

手动拉取镜像：
```bash
docker pull ghcr.io/sagernet/sing-box:latest
```

## 生产环境建议

1. **使用 HTTPS**
   - 配置 Nginx/Caddy 反向代理
   - 使用 Let's Encrypt 证书

2. **限制访问**
   - 配置防火墙规则
   - 仅开放必要端口
   - 使用强密码和复杂的 JWT_SECRET

3. **监控和日志**
   - 配置日志轮转
   - 使用监控工具（Prometheus + Grafana）
   - 设置告警规则

4. **定期备份**
   - 备份 SQLite 数据库
   - 备份配置文件
   - 使用自动化备份脚本

5. **更新策略**
   - 定期更新依赖
   - 监控安全漏洞
   - 测试后再部署到生产

## 性能优化

### 调整监控间隔

如果客户端数量较多，可以增加监控间隔：

```env
TRAFFIC_MONITOR_INTERVAL=120  # 改为 2 分钟
```

### 数据库优化

定期清理历史数据：

```bash
# 进入容器
docker exec -it singbox-limiter sh

# 连接数据库
cd data
sqlite3 singbox.db

# 删除 30 天前的流量历史
DELETE FROM traffic_history
WHERE datetime(timestamp) < datetime('now', '-30 days');

# 优化数据库
VACUUM;
```

## 安全加固

1. 使用非 root 用户运行容器
2. 限制 Docker Socket 访问权限
3. 配置网络隔离
4. 定期更新基础镜像
5. 启用容器日志审计

## 常见问题 FAQ

**Q: 如何修改管理员密码？**

A: 修改 `.env` 文件中的 `ADMIN_PASSWORD`，然后重启服务：
```bash
docker-compose restart
```

**Q: 如何迁移到新服务器？**

A:
1. 备份 `data/` 和 `configs/` 目录
2. 在新服务器上部署应用
3. 恢复备份的数据
4. 更新 `.env` 中的 `SERVER_IP`
5. 重启所有客户端容器

**Q: 流量统计不准确？**

A:
- 检查监控间隔设置
- 确保容器网络模式为 bridge
- 查看日志中的错误信息
- 验证 Docker API 访问权限

**Q: 如何添加更多管理员？**

A: 当前版本仅支持单管理员。多管理员功能计划在后续版本添加。

## 技术支持

遇到问题？
1. 查看 [README.md](README.md)
2. 查看 [DEVELOPMENT.md](DEVELOPMENT.md)
3. 提交 Issue
4. 查看项目 Wiki

## License

MIT

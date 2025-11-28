# 部署前检查清单

## ✅ 环境准备

- [ ] Node.js 18+ 已安装
- [ ] Docker & Docker Compose 已安装
- [ ] 服务器防火墙已配置（开放必要端口）
- [ ] 域名 DNS 已解析（如使用域名）

## ✅ 代码配置

- [ ] 已修改 `.env` 中的 `ADMIN_PASSWORD`
- [ ] 已修改 `.env` 中的 `JWT_SECRET`（建议 32+ 位随机字符串）
- [ ] 已配置 `SERVER_IP` 为服务器公网 IP
- [ ] 已检查 `TRAFFIC_MONITOR_INTERVAL` 设置（默认 60 秒）

## ✅ 证书生成

- [ ] 已运行 `npm run init-cert` 生成自签证书
- [ ] `certs/server.pem` 和 `certs/server.key` 存在

## ✅ 构建测试

### 前端构建

```bash
cd frontend
npm install
npm run build
# 检查 ../public/ 目录是否有构建产物
ls -la ../public/
```

- [ ] 前端构建成功
- [ ] `public/` 目录包含 `index.html`, `dashboard.html`, `client.html`, `share.html`

### 后端测试

```bash
npm install
node --check server/index.js
```

- [ ] 后端依赖安装成功
- [ ] 语法检查通过

## ✅ Docker 构建

```bash
# 构建镜像
docker build -t singbox-limiter:test .

# 检查镜像大小
docker images singbox-limiter:test
```

- [ ] Docker 镜像构建成功
- [ ] 镜像大小合理（< 200MB）

## ✅ 本地测试

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 等待 10 秒后测试
curl http://localhost:3000/health
```

- [ ] 服务启动成功
- [ ] 健康检查通过
- [ ] 可以访问登录页面 `http://localhost:3000`
- [ ] 可以正常登录

## ✅ 功能测试

- [ ] 登录成功
- [ ] 创建客户端成功
- [ ] 查看客户端详情成功
- [ ] 获取连接 URL 成功
- [ ] 分享页面访问成功
- [ ] 删除客户端成功

## ✅ GitHub 配置

### 准备推送

```bash
git add .
git commit -m "feat: complete Phase 3 & 4 - frontend and CI/CD"
git remote add origin https://github.com/YOUR_USERNAME/singbox-limiter.git
git push -u origin main
```

- [ ] 代码已提交
- [ ] 已推送到 GitHub

### GitHub Actions

- [ ] GitHub Actions 权限已启用
  - 前往 `Settings` > `Actions` > `General`
  - 勾选 "Read and write permissions"
  - 勾选 "Allow GitHub Actions to create and approve pull requests"

- [ ] GitHub Packages 权限已配置
  - 确保 `GITHUB_TOKEN` 有 `packages: write` 权限

- [ ] CI 测试通过
  - 查看 `Actions` 标签页
  - 确认 `CI Tests` 工作流通过

- [ ] Docker 镜像构建成功
  - 确认 `Build and Push Docker Image` 工作流通过
  - 镜像已推送到 `ghcr.io/YOUR_USERNAME/singbox-limiter`

## ✅ 生产部署

### 服务器准备

```bash
# 拉取镜像
docker pull ghcr.io/YOUR_USERNAME/singbox-limiter:main

# 创建数据目录
mkdir -p ~/singbox-limiter/{data,certs,configs/clients}
cd ~/singbox-limiter
```

- [ ] 镜像拉取成功
- [ ] 目录已创建

### 配置 .env

```bash
cat > .env << EOF
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YOUR_SECURE_PASSWORD
JWT_SECRET=$(openssl rand -base64 32)
SERVER_IP=YOUR_SERVER_PUBLIC_IP
TRAFFIC_MONITOR_INTERVAL=60
EOF
```

- [ ] `.env` 文件已创建
- [ ] 密码已修改

### 生成证书

```bash
docker run --rm -v $(pwd)/certs:/certs alpine/openssl \
  req -x509 -newkey rsa:4096 -sha256 -days 3650 \
  -nodes -keyout /certs/server.key -out /certs/server.pem \
  -subj "/CN=singbox-limiter"
```

- [ ] 证书生成成功

### 启动服务

```bash
docker run -d \
  --name singbox-limiter \
  --restart always \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/certs:/app/certs \
  -v $(pwd)/configs:/app/configs \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  --env-file .env \
  ghcr.io/YOUR_USERNAME/singbox-limiter:main
```

- [ ] 容器启动成功
- [ ] 端口 3000 已开放
- [ ] 可以访问 `http://SERVER_IP:3000`

## ✅ 反向代理（可选但推荐）

### Nginx + Let's Encrypt

```bash
sudo apt install nginx certbot python3-certbot-nginx

# 配置 Nginx
sudo nano /etc/nginx/sites-available/singbox-limiter

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 重启 Nginx
sudo systemctl reload nginx
```

- [ ] Nginx 已配置
- [ ] SSL 证书已获取
- [ ] HTTPS 访问成功

## ✅ 监控和维护

### 日志查看

```bash
# 查看容器日志
docker logs -f singbox-limiter

# 查看最近 100 行
docker logs --tail 100 singbox-limiter
```

- [ ] 日志正常，无错误

### 备份

```bash
# 备份数据库
cp data/singbox.db data/singbox.db.backup.$(date +%Y%m%d)

# 打包备份
tar -czf backup-$(date +%Y%m%d).tar.gz data/ configs/
```

- [ ] 已设置定期备份计划

### 更新

```bash
# 拉取最新镜像
docker pull ghcr.io/YOUR_USERNAME/singbox-limiter:main

# 停止旧容器
docker stop singbox-limiter
docker rm singbox-limiter

# 启动新容器（使用上面的启动命令）
```

- [ ] 更新流程已测试

## ✅ 安全加固

- [ ] 已修改默认密码
- [ ] JWT_SECRET 足够复杂
- [ ] 已配置 HTTPS
- [ ] 已限制 Docker Socket 权限
- [ ] 已配置防火墙规则
- [ ] 已设置定期备份

## ✅ 性能优化

- [ ] 流量监控间隔已调整（根据客户端数量）
- [ ] 数据库定期清理计划已设置
- [ ] 日志轮转已配置

---

## 🎉 部署完成！

访问你的站点并测试所有功能：

- [ ] 登录页面正常
- [ ] 创建客户端成功
- [ ] 流量监控工作正常
- [ ] 分享页面可访问
- [ ] 所有功能正常运行

---

## 📞 遇到问题？

1. 查看容器日志：`docker logs singbox-limiter`
2. 检查环境变量：`docker exec singbox-limiter env`
3. 查看项目文档：[DEPLOYMENT.md](DEPLOYMENT.md)
4. 提交 Issue：https://github.com/YOUR_USERNAME/singbox-limiter/issues

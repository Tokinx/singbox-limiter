# 🚀 GitHub 推送和部署指南

## 项目完成状态

✅ **Phase 1 & 2**: 后端 API + 流量监控（已完成）
✅ **Phase 3**: 前端 UI（已完成）
✅ **Phase 4**: CI/CD + 优化（已完成）

**统计数据:**
- 总文件数: 37
- JavaScript 文件: 13
- HTML 页面: 4
- 总代码行数: 2159+
- Markdown 文档: 6

---

## 📝 推送到 GitHub

### 第一步：初始化 Git 仓库

```bash
cd /mnt/c/Users/idevs/Documents/Workspace/singbox-limiter

# 如果还没有初始化 git
git init

# 检查状态
git status
```

### 第二步：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称: `singbox-limiter`
3. 描述: `基于 Docker 的 SingBox 客户端管理系统，支持流量限制和实时监控`
4. 选择 Public 或 Private
5. **不要**勾选 "Initialize this repository with a README"
6. 点击 "Create repository"

### 第三步：推送代码

```bash
# 添加所有文件
git add .

# 提交
git commit -m "feat: complete singbox-limiter v1.0.0

Phase 1 & 2:
- Express API 服务器
- SQLite 数据库
- Docker 流量监控
- 流量限制和到期管理
- 客户端 CRUD 操作
- 分享页面 API

Phase 3:
- Vite + 纯 JS 前端
- 登录页面
- 控制面板
- 客户端详情（含图表）
- 分享页面 UI

Phase 4:
- API 频率限制
- 多阶段 Dockerfile
- GitHub Actions CI/CD
- 完整文档"

# 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/singbox-limiter.git

# 推送
git branch -M main
git push -u origin main
```

### 第四步：配置 GitHub Actions 权限

1. 进入仓库 Settings
2. 左侧菜单选择 `Actions` > `General`
3. 找到 "Workflow permissions"
4. 选择 "Read and write permissions"
5. 勾选 "Allow GitHub Actions to create and approve pull requests"
6. 点击 "Save"

### 第五步：启用 GitHub Packages

1. 确保你的账号已启用 GitHub Packages
2. 推送后会自动触发 GitHub Actions
3. 构建的镜像会推送到 `ghcr.io/YOUR_USERNAME/singbox-limiter`

---

## 🔧 GitHub Actions 工作流

推送后会自动触发两个工作流：

### 1. CI Tests（持续集成测试）

```yaml
触发条件: push 到 main/master/develop 分支
测试内容:
  - Node.js 18.x & 20.x 兼容性
  - 前端构建
  - 后端语法检查
  - 构建产物验证
```

### 2. Docker Build（镜像构建）

```yaml
触发条件: push 到 main/master 或打 tag
构建内容:
  - 多阶段 Docker 构建
  - 支持 linux/amd64 和 linux/arm64
  - 推送到 GitHub Container Registry
  - 生成镜像签名
```

查看构建状态:
- 访问仓库的 `Actions` 标签页
- 等待构建完成（约 3-5 分钟）

---

## 🐳 使用 GitHub 镜像部署

### 拉取最新镜像

```bash
# 拉取镜像（如果是私有仓库需要先登录）
docker login ghcr.io -u YOUR_USERNAME

# 拉取镜像
docker pull ghcr.io/YOUR_USERNAME/singbox-limiter:main
```

### 快速启动

```bash
# 创建工作目录
mkdir -p ~/singbox-limiter && cd ~/singbox-limiter

# 创建 .env 文件
cat > .env << EOF
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$(openssl rand -base64 16)
JWT_SECRET=$(openssl rand -base64 32)
SERVER_IP=YOUR_SERVER_IP
TRAFFIC_MONITOR_INTERVAL=60
EOF

# 创建必要目录
mkdir -p data certs configs/clients

# 生成证书
docker run --rm -v $(pwd)/certs:/certs alpine/openssl \
  req -x509 -newkey rsa:4096 -sha256 -days 3650 \
  -nodes -keyout /certs/server.key -out /certs/server.pem \
  -subj "/CN=singbox-limiter" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

# 启动服务
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

# 查看日志
docker logs -f singbox-limiter
```

---

## 🏷️ 版本发布

### 创建版本 Tag

```bash
# 创建 tag
git tag -a v1.0.0 -m "Release v1.0.0

Features:
- 完整的客户端管理系统
- 实时流量监控
- 流量限制和到期管理
- Web UI 界面
- 分享页面
- Docker 部署支持
"

# 推送 tag
git push origin v1.0.0
```

推送 tag 后会自动触发 Docker 构建，生成以下镜像标签：
- `ghcr.io/YOUR_USERNAME/singbox-limiter:v1.0.0`
- `ghcr.io/YOUR_USERNAME/singbox-limiter:v1.0`
- `ghcr.io/YOUR_USERNAME/singbox-limiter:v1`
- `ghcr.io/YOUR_USERNAME/singbox-limiter:main`

### 发布 Release

1. 访问 `https://github.com/YOUR_USERNAME/singbox-limiter/releases`
2. 点击 "Draft a new release"
3. 选择刚才创建的 tag `v1.0.0`
4. Release title: `v1.0.0 - 初始版本发布`
5. 描述内容:

```markdown
## 🎉 v1.0.0 初始版本发布

### 功能特性

✅ **客户端管理**
- 创建/编辑/删除客户端
- Reality + Hysteria2 双协议支持
- 自动生成配置和容器

✅ **流量控制**
- 实时监控（Docker API）
- 流量限制和自动停用
- 月度流量重置

✅ **Web 界面**
- 现代化 UI 设计
- 流量趋势图表
- 分享页面生成

✅ **部署支持**
- Docker 镜像
- docker-compose
- GitHub Actions CI/CD

### 快速开始

docker pull ghcr.io/YOUR_USERNAME/singbox-limiter:v1.0.0

详细文档：[README.md](README.md)

### 镜像信息

- amd64: `ghcr.io/YOUR_USERNAME/singbox-limiter:v1.0.0`
- arm64: `ghcr.io/YOUR_USERNAME/singbox-limiter:v1.0.0`
```

6. 点击 "Publish release"

---

## 📋 部署检查清单

部署前请参考 [CHECKLIST.md](CHECKLIST.md) 完成所有检查项。

---

## 🆘 常见问题

### Q: GitHub Actions 构建失败？

**A:** 检查以下几点：
1. Actions 权限是否正确配置
2. 查看 Actions 日志找到具体错误
3. 确保代码没有语法错误

### Q: 镜像拉取失败？

**A:**
```bash
# 如果是私有仓库，需要先登录
docker login ghcr.io -u YOUR_USERNAME

# 使用 Personal Access Token
# 前往 https://github.com/settings/tokens/new
# 勾选 read:packages 权限
```

### Q: 如何更新到最新版本？

**A:**
```bash
# 拉取最新镜像
docker pull ghcr.io/YOUR_USERNAME/singbox-limiter:main

# 停止旧容器
docker stop singbox-limiter && docker rm singbox-limiter

# 启动新容器（使用相同的启动命令）
```

---

## 🎯 下一步

1. ✅ 推送代码到 GitHub
2. ✅ 等待 Actions 构建完成
3. ✅ 在测试环境部署验证
4. ✅ 生产环境部署
5. ✅ 配置监控和备份
6. ✅ 完善文档和 README

---

## 📞 需要帮助？

- 📖 查看文档: [README.md](README.md)
- 🐛 报告问题: https://github.com/YOUR_USERNAME/singbox-limiter/issues
- 💬 讨论区: https://github.com/YOUR_USERNAME/singbox-limiter/discussions

---

**祝部署顺利！🎉**

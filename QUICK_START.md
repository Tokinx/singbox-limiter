# 🚀 快速推送指南

## 推送前本地测试

运行本地测试脚本验证构建：

```bash
./test-build.sh
```

这会自动测试：
- ✅ 前端构建
- ✅ 后端语法
- ✅ Docker 镜像构建
- ✅ 容器启动

---

## 推送到 GitHub

### 1. 创建 GitHub 仓库

访问 https://github.com/new

- **仓库名**: `singbox-limiter`
- **描述**: `基于 Docker 的 SingBox 客户端管理系统，支持流量限制和实时监控`
- **可见性**: Public 或 Private
- **不要**勾选 "Initialize this repository"

### 2. 推送代码

```bash
# 如果是第一次推送
git init
git add .
git commit -m "feat: initial release v1.0.0

- Complete backend API with traffic monitoring
- Modern web UI with Chart.js
- Docker multi-stage build
- GitHub Actions for automatic image builds"

git remote add origin https://github.com/YOUR_USERNAME/singbox-limiter.git
git branch -M main
git push -u origin main
```

### 3. 配置 GitHub Actions 权限

1. 进入仓库 **Settings**
2. 左侧菜单 **Actions** → **General**
3. **Workflow permissions** 部分：
   - 选择 ✅ **Read and write permissions**
   - 勾选 ✅ **Allow GitHub Actions to create and approve pull requests**
4. 点击 **Save**

### 4. 等待构建完成

1. 访问仓库的 **Actions** 标签页
2. 查看 "Build and Push Docker Image" 工作流
3. 等待构建完成（约 5-10 分钟）

---

## 拉取和使用镜像

构建成功后，镜像会推送到 GitHub Container Registry：

```bash
# 拉取最新镜像
docker pull ghcr.io/YOUR_USERNAME/singbox-limiter:latest

# 或使用主分支标签
docker pull ghcr.io/YOUR_USERNAME/singbox-limiter:main
```

### 快速启动

```bash
# 创建目录
mkdir -p ~/singbox-limiter && cd ~/singbox-limiter

# 创建 .env
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
  -subj "/CN=singbox-limiter"

# 启动容器
docker run -d \
  --name singbox-limiter \
  --restart always \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/certs:/app/certs \
  -v $(pwd)/configs:/app/configs \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  --env-file .env \
  ghcr.io/YOUR_USERNAME/singbox-limiter:latest

# 查看日志
docker logs -f singbox-limiter
```

---

## 版本发布

### 创建版本标签

```bash
# 创建并推送 tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

这会自动触发构建并生成以下镜像标签：
- `ghcr.io/YOUR_USERNAME/singbox-limiter:v1.0.0`
- `ghcr.io/YOUR_USERNAME/singbox-limiter:v1.0`
- `ghcr.io/YOUR_USERNAME/singbox-limiter:v1`
- `ghcr.io/YOUR_USERNAME/singbox-limiter:latest`

---

## 故障排查

### 构建失败？

1. 检查 Actions 日志查看具体错误
2. 确保 Actions 权限已正确配置
3. 验证 Dockerfile 语法正确

### 镜像拉取失败？

如果仓库是私有的：

```bash
# 生成 Personal Access Token
# https://github.com/settings/tokens/new
# 勾选: read:packages

# 登录
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 拉取镜像
docker pull ghcr.io/YOUR_USERNAME/singbox-limiter:latest
```

### 构建时间过长？

多架构构建（amd64 + arm64）需要较长时间。如果只需要 amd64：

编辑 `.github/workflows/docker-build.yml`：
```yaml
platforms: linux/amd64  # 删除 arm64
```

---

## ✅ 检查清单

推送前确认：

- [ ] 本地测试通过（`./test-build.sh`）
- [ ] 已创建 GitHub 仓库
- [ ] 已推送代码到 main 分支
- [ ] 已配置 Actions 权限
- [ ] Actions 构建成功
- [ ] 镜像已推送到 ghcr.io
- [ ] 可以成功拉取镜像

---

**准备好了吗？运行 `./test-build.sh` 开始测试！**

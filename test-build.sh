#!/bin/bash

# 本地构建测试脚本
# 用于在推送到 GitHub 前验证 Docker 构建

set -e

echo "🔍 SingBox Limiter - 本地构建测试"
echo "=================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker 已安装"

# 1. 前端构建测试
echo ""
echo "📦 步骤 1/4: 测试前端构建"
echo "------------------------"

if [ ! -d "frontend/node_modules" ]; then
    echo "安装前端依赖..."
    cd frontend && npm install && cd ..
fi

echo "构建前端..."
cd frontend
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} 前端构建成功"
else
    echo -e "${RED}❌ 前端构建失败${NC}"
    exit 1
fi
cd ..

# 检查构建产物
if [ -f "public/index.html" ]; then
    echo -e "${GREEN}✓${NC} 构建产物存在"
    ls -lh public/*.html 2>/dev/null | awk '{print "  - " $9 " (" $5 ")"}'
else
    echo -e "${RED}❌ 构建产物不存在${NC}"
    exit 1
fi

# 2. 后端依赖测试
echo ""
echo "📦 步骤 2/4: 测试后端依赖"
echo "------------------------"

if [ ! -d "node_modules" ]; then
    echo "安装后端依赖..."
    npm install
fi

echo "检查后端语法..."
node --check server/index.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} 后端语法检查通过"
else
    echo -e "${RED}❌ 后端语法错误${NC}"
    exit 1
fi

# 3. Docker 构建测试
echo ""
echo "🐳 步骤 3/4: 测试 Docker 构建"
echo "----------------------------"

echo "开始构建 Docker 镜像（仅 amd64）..."
docker build -t singbox-limiter:test --platform linux/amd64 .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Docker 镜像构建成功"
else
    echo -e "${RED}❌ Docker 构建失败${NC}"
    exit 1
fi

# 检查镜像大小
IMAGE_SIZE=$(docker images singbox-limiter:test --format "{{.Size}}")
echo -e "${GREEN}✓${NC} 镜像大小: $IMAGE_SIZE"

# 4. 容器启动测试
echo ""
echo "🚀 步骤 4/4: 测试容器启动"
echo "------------------------"

# 创建临时环境变量文件
cat > .env.test << EOF
ADMIN_USERNAME=admin
ADMIN_PASSWORD=test123
JWT_SECRET=test_secret_key_for_testing_only
SERVER_IP=127.0.0.1
PORT=3001
TRAFFIC_MONITOR_INTERVAL=60
EOF

echo "启动测试容器..."
docker run -d \
  --name singbox-limiter-test \
  -p 3001:3001 \
  --env-file .env.test \
  singbox-limiter:test

sleep 5

# 健康检查
echo "执行健康检查..."
HEALTH_CHECK=$(curl -s http://localhost:3001/health 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} 容器启动成功"
    echo "响应: $HEALTH_CHECK"
else
    echo -e "${RED}❌ 健康检查失败${NC}"
    docker logs singbox-limiter-test
    docker stop singbox-limiter-test
    docker rm singbox-limiter-test
    rm .env.test
    exit 1
fi

# 清理测试容器
echo ""
echo "🧹 清理测试环境..."
docker stop singbox-limiter-test > /dev/null 2>&1
docker rm singbox-limiter-test > /dev/null 2>&1
rm .env.test

echo ""
echo -e "${GREEN}=================================="
echo "✅ 所有测试通过！"
echo "==================================${NC}"
echo ""
echo "📋 测试结果汇总:"
echo "  ✓ 前端构建成功"
echo "  ✓ 后端语法正确"
echo "  ✓ Docker 镜像构建成功 ($IMAGE_SIZE)"
echo "  ✓ 容器启动正常"
echo ""
echo "🚀 可以安全推送到 GitHub 了！"
echo ""
echo "推送命令:"
echo "  git add ."
echo "  git commit -m \"feat: ready for deployment\""
echo "  git push origin main"
echo ""

# 询问是否清理
read -p "是否删除测试镜像? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker rmi singbox-limiter:test
    echo -e "${GREEN}✓${NC} 测试镜像已删除"
fi

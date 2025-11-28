#!/bin/bash

# SingBox Limiter 快速启动脚本

set -e

echo "🚀 SingBox Limiter 快速启动"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
  echo "⚠️  未找到 .env 文件，正在创建..."
  cp .env.example .env
  echo "✓ 已创建 .env 文件，请编辑配置后重新运行"
  echo ""
  echo "必须配置项："
  echo "  - ADMIN_PASSWORD (管理员密码)"
  echo "  - JWT_SECRET (JWT 密钥)"
  echo "  - SERVER_IP (服务器公网 IP)"
  exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
  echo "📦 正在安装依赖..."
  npm install
  echo ""
fi

# 检查证书
if [ ! -f "certs/server.pem" ] || [ ! -f "certs/server.key" ]; then
  echo "🔐 正在生成 SSL 证书..."
  npm run init-cert
  echo ""
fi

# 检查目录
mkdir -p data configs/clients certs public

# 加载环境变量
source .env

# 显示配置信息
echo "📋 当前配置："
echo "  - 端口: ${PORT:-3000}"
echo "  - 管理员: ${ADMIN_USERNAME:-admin}"
echo "  - 服务器 IP: ${SERVER_IP:-未配置}"
echo "  - 流量监控间隔: ${TRAFFIC_MONITOR_INTERVAL:-60}秒"
echo ""

# 启动服务
echo "🚀 正在启动服务..."
echo ""

if [ "$1" == "dev" ]; then
  npm run dev
else
  npm start
fi

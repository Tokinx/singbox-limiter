# ============= 前端构建阶段 =============
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖配置
COPY frontend/package*.json ./

# 安装依赖
RUN npm ci

# 复制前端源码
COPY frontend/ ./

# 构建前端
RUN npm run build

# ============= 后端构建阶段 =============
FROM node:18-alpine AS backend-builder

WORKDIR /app

# 安装 OpenSSL
RUN apk add --no-cache openssl

# 复制后端依赖配置
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production

# ============= 最终镜像 =============
FROM node:18-alpine

# 安装运行时依赖
RUN apk add --no-cache openssl dumb-init

WORKDIR /app

# 从构建阶段复制依赖
COPY --from=backend-builder /app/node_modules ./node_modules

# 复制后端源码
COPY server/ ./server/
COPY package*.json ./

# 从前端构建阶段复制构建产物
COPY --from=frontend-builder /app/public ./public

# 创建必要的目录
RUN mkdir -p data certs configs/clients

# 暴露端口
EXPOSE 3000

# 使用 dumb-init 作为 PID 1（优雅处理信号）
ENTRYPOINT ["dumb-init", "--"]

# 启动服务
CMD ["node", "server/index.js"]

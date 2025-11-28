FROM node:18-alpine

# 安装 OpenSSL（用于生成证书）
RUN apk add --no-cache openssl

WORKDIR /app

# 复制依赖配置
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源码
COPY server/ ./server/
COPY public/ ./public/

# 创建必要的目录
RUN mkdir -p data certs configs/clients

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["node", "server/index.js"]

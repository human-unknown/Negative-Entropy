FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine

WORKDIR /app

# 安装运行时依赖（兼容 alpine）
RUN apk add --no-cache dumb-init

COPY --from=builder /app/node_modules ./node_modules
COPY . .

# 创建非 root 用户运行服务
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

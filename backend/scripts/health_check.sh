#!/bin/bash
# 服务健康检查脚本

SERVICE_URL="http://localhost:3000/api/health"
MAX_RETRIES=3

for i in $(seq 1 $MAX_RETRIES); do
  if curl -f -s $SERVICE_URL > /dev/null; then
    exit 0
  fi
  sleep 2
done

echo "服务健康检查失败，重启服务..."
systemctl restart negentropy-backend

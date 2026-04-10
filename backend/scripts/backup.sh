#!/bin/bash

# 数据库备份脚本
# 使用方法: ./backup.sh

# 配置
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-debate_platform}"
BACKUP_DIR="./backups"
MAX_BACKUPS=7

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="${DB_NAME}_${TIMESTAMP}.sql"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

# 执行备份
if [ -z "$DB_PASSWORD" ]; then
  mysqldump -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" > "$FILEPATH"
else
  mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$FILEPATH"
fi

if [ $? -eq 0 ]; then
  echo "✓ 备份成功: $FILENAME"
  
  # 压缩备份文件
  gzip "$FILEPATH"
  echo "✓ 压缩完成: ${FILENAME}.gz"
  
  # 清理旧备份
  cd "$BACKUP_DIR"
  ls -t *.sql.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
  echo "✓ 清理旧备份完成"
else
  echo "✗ 备份失败"
  exit 1
fi

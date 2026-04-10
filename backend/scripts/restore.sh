#!/bin/bash
# MySQL 数据库恢复脚本

if [ -z "$1" ]; then
  echo "用法: ./restore.sh <备份文件路径>"
  exit 1
fi

DB_NAME="negentropy_production"
DB_USER="negentropy_prod"
DB_PASS="db_password_change_me"
BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "错误: 备份文件不存在"
  exit 1
fi

echo "开始恢复数据库..."
gunzip < $BACKUP_FILE | mysql -u$DB_USER -p$DB_PASS $DB_NAME

echo "恢复完成"

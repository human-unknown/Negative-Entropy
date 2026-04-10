#!/bin/bash
# MySQL 定期备份脚本

DB_NAME="negentropy_production"
DB_USER="negentropy_prod"
DB_PASS="db_password_change_me"
BACKUP_DIR="/var/backups/negentropy"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# 删除 7 天前的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "备份完成: backup_$DATE.sql.gz"

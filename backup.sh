#!/bin/bash

# 大红书/大绿书 备份脚本
# 每天自动备份数据库和上传文件

BACKUP_DIR="/root/dahongshu_backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="dahongshu_postgres"
VOLUME_NAME="dahongshu_dahongshu_pgdata"
UPLOADS_DIR="/root/dahongshu/public/uploads"

# 创建备份目录
mkdir -p $BACKUP_DIR

echo "[$(date)] Starting backup..."

# 1. 备份数据库
echo "[$(date)] Backing up database..."
docker exec $DB_CONTAINER pg_dump -U postgres dahongshu > $BACKUP_DIR/dahongshu_db_$DATE.sql
if [ $? -eq 0 ]; then
    echo "[$(date)] Database backup completed: dahongshu_db_$DATE.sql"
else
    echo "[$(date)] ERROR: Database backup failed!"
    exit 1
fi

# 2. 备份上传文件
echo "[$(date)] Backing up uploads..."
tar -czf $BACKUP_DIR/dahongshu_uploads_$DATE.tar.gz -C $(dirname $UPLOADS_DIR) $(basename $UPLOADS_DIR)
if [ $? -eq 0 ]; then
    echo "[$(date)] Uploads backup completed: dahongshu_uploads_$DATE.tar.gz"
else
    echo "[$(date)] ERROR: Uploads backup failed!"
    exit 1
fi

# 3. 清理旧备份（保留最近7天）
echo "[$(date)] Cleaning old backups (keeping last 7 days)..."
find $BACKUP_DIR -name "dahongshu_db_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "dahongshu_uploads_*.tar.gz" -mtime +7 -delete

echo "[$(date)] Backup completed successfully!"

# 显示备份文件列表
ls -lh $BACKUP_DIR

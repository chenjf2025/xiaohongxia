#!/bin/bash
# 自定义启动脚本 — 替代 Dockerfile 的 CMD
# 每次容器启动时自动检测并执行 pending 的 Prisma migration

MIGRATE_LOCK="/tmp/.prisma_migrate.lock"
LOG_FILE="/app/.migration.log"

echo "[entrypoint] 启动中..."

# 尝试获取迁移锁
acquire_lock() {
    local count=0
    while [ $count -lt 30 ]; do
        if [ ! -f "$MIGRATE_LOCK" ]; then
            echo $$ > "$MIGRATE_LOCK"
            if [ "$(cat "$MIGRATE_LOCK" 2>/dev/null)" = $$ ]; then
                return 0
            fi
        fi
        count=$((count+1))
        sleep 1
    done
    return 1
}

release_lock() {
    rm -f "$MIGRATE_LOCK"
}

do_migrate() {
    echo "[entrypoint] 执行 Prisma migration..."
    cd /app
    npx prisma migrate deploy >> "$LOG_FILE" 2>&1 || {
        echo "[entrypoint] warning: migration failed (may already be applied)"
    }
}

start_app() {
    echo "[entrypoint] 启动应用服务..."
    cd /app
    exec node server.mjs
}

if acquire_lock; then
    trap release_lock EXIT
    do_migrate
    start_app
else
    echo "[entrypoint] 无法获取迁移锁，跳过"
    sleep 5
    start_app
fi

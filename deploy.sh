#!/bin/bash
# 小红虾 - 生产部署脚本（增强版）
# 用法: ./deploy.sh
#
# 增强：每次部署自动执行 prisma migrate deploy 同步数据库结构
# 防止代码更新了 schema 但数据库没有对应列/表的问题

set -e

echo "=== 小红虾部署开始 $(date '+%Y-%m-%d %H:%M:%S') ==="
cd /home/chenjf/dahongshu

# 读取环境变量
if [ -f .env.prod ]; then
    export $(grep -v '^#' .env.prod | xargs)
fi

# 拉取最新代码
echo "[1/7] 拉取最新代码..."
git fetch origin dev
git checkout dev
git pull origin dev

# 安装依赖
echo "[2/7] 安装依赖..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# ===== 关键：同步数据库 Schema =====
echo "[3/7] 同步数据库 Schema..."
pnpm exec prisma migrate deploy || {
    echo "  ⚠️ migrate deploy 失败，尝试 db push..."
    pnpm exec prisma db push --accept-data-loss
}

# 构建 Docker 镜像
echo "[4/7] 构建 Docker 镜像..."
docker build -f Dockerfile.prod -t xiaohongxia:latest .

# 停止旧容器
echo "[5/7] 停止旧容器..."
docker stop dahongshu_app 2>/dev/null || true
docker rm dahongshu_app 2>/dev/null || true

# 启动新容器
echo "[6/7] 启动新容器..."
docker run -d     --name dahongshu_app     --restart unless-stopped     -p 3100:3100     --network docker_default     -e DATABASE_URL="${DATABASE_URL}"     -e REDIS_URL="${REDIS_URL:-redis://docker-redis-1:6379}"     -e JWT_SECRET="${JWT_SECRET}"     -e NODE_ENV=production     -v /home/chenjf/dahongshu_uploads:/app/public/uploads     xiaohongxia:latest

# 健康检查
echo "[7/7] 健康检查..."
sleep 15
HTTP_CODE=$(curl -sf -o /dev/null -w '%{http_code}' http://localhost:3100/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 部署成功! 服务运行在 http://localhost:3100 (HTTP $HTTP_CODE)"
    docker image prune -f > /dev/null 2>&1 || true
else
    echo "❌ 部署失败! HTTP=$HTTP_CODE"
    echo "查看日志: docker logs --tail=30 dahongshu_app"
    exit 1
fi

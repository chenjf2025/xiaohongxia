#!/bin/bash
# 小红虾 - 生产部署脚本
# 用法: ./deploy.sh

set -e

echo "=== 小红虾部署开始 ==="
cd /home/chenjf/dahongshu

# 读取环境变量
if [ -f .env.prod ]; then
    export $(grep -v '^#' .env.prod | xargs)
fi

# 拉取最新代码
echo "[1/5] 拉取最新代码..."
git fetch origin dev
git checkout dev
git pull origin dev

# 构建 Docker 镜像
echo "[2/5] 构建 Docker 镜像..."
docker build -f Dockerfile.prod -t xiaohongxia:latest .

# 停止旧容器
echo "[3/5] 停止旧容器..."
docker stop dahongshu_app || true
docker rm dahongshu_app || true

# 启动新容器
echo "[4/5] 启动新容器..."
docker run -d \
    --name dahongshu_app \
    --restart unless-stopped \
    -p 3100:3100 \
    --network docker_default \
    -e DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@docker-db_postgres-1:5432/dahongshu?schema=public" \
    -e REDIS_URL=redis://docker-redis-1:6379 \
    -e JWT_SECRET="${JWT_SECRET}" \
    -e NODE_ENV=production \
    -v /home/chenjf/dahongshu_uploads:/app/public/uploads \
    xiaohongxia:latest

# 健康检查
echo "[5/5] 健康检查..."
sleep 10
if curl -sf http://localhost:3100/ > /dev/null 2>&1
then
    echo "✅ 部署成功! 服务运行在 http://localhost:3100"
else
    echo "❌ 部署失败! 查看日志: docker logs dahongshu_app"
    exit 1
fi

# 小红虾项目 Claude Code 配置

## 当前状态 (2026-04-23)

### 服务器（内网）

| 项目 | 值 |
|------|-----|
| IP | `192.168.71.128` |
| SSH 用户 | `chenjf` |
| SSH 密码 | `chenjf8018` |
| SSH 端口 | `22` |
| 域名 | `xiaohongxia.aiduno.cc`, `xiaohongxia.ai1717.cn` |
| 应用端口 | `3100` |
| 数据库端口 | `5432` (容器内) |
| Docker 网络 | `docker_default` |

### GitHub 仓库

| 项目 | 值 |
|------|-----|
| 仓库 | `https://github.com/chenjf2025/xiaohongxia` |
| 主分支 | `dev` (开发) / `main` (生产) |
| GHCR 镜像 | `ghcr.io/chenjf2025/xiaohongxia` |
| GitHub Token | 存储在 `/home/chenjf/.gh_token` |

---

## 关键命令

### 连接服务器
```bash
ssh chenjf@192.168.71.128
```

### 进入容器
```bash
docker exec -it dahongshu_app /bin/sh
```

### 数据库连接
```bash
docker exec -it docker-db_postgres-1 psql -U postgres -d dahongshu
```

### 查看日志
```bash
docker logs --tail=30 dahongshu_app
docker logs -f dahongshu_app
```

### 健康检查
```bash
curl -sf http://localhost:3100/
curl -s http://localhost:3100/api/posts?limit=1 | python3 -m json.tool
```

### 重启应用
```bash
docker restart dahongshu_app
```

### 部署
```bash
cd /home/chenjf/dahongshu
./deploy.sh
```

---

## 重要规范

### ⚠️ 数据库 Schema 同步
每次代码有 schema 变更，必须执行：
```bash
pnpm exec prisma migrate dev   # 开发时
pnpm exec prisma migrate deploy # 生产部署时（已由 deploy.sh / entrypoint.sh 自动执行）
```

### ⚠️ 上传目录
每次重建容器必须挂载 uploads 目录：
```bash
-v /home/chenjf/dahongshu_uploads:/app/public/uploads
```

### ⚠️ .env 不要加引号
```
DATABASE_URL=postgresql://postgres:password@host:5432/dahongshu
```
不要写成 `DATABASE_URL="postgresql://..."`（引号会被 Docker 当作值的一部分）

---

## 项目路径

| 路径 | 说明 |
|------|------|
| `/home/chenjf/dahongshu/` | 项目根目录 |
| `/home/chenjf/dahongshu_uploads/` | 用户上传文件 |
| `/home/chenjf/dahongshu_backups/` | 数据库备份 |
| `/home/chenjf/.auto_deploy.log` | 自动部署日志 |

# 小红虾 (XiaoHongXia) — 运维排障手册

> 更新: 2026-04-23
> 服务器: `192.168.71.128` (Ubuntu, 用户 `chenjf`)
> 域名: `xiaohongxia.aiduno.cc` / `xiaohongxia.ai1717.cn`

---

## 一、架构概览

```
用户浏览器
   ↓ HTTPS
Nginx (docker-nginx-1)
   ↓ 代理
Next.js (:3100, 容器 dahongshu_app / dahongshu-gpu)
   ↓
PostgreSQL (:5432, 容器 docker-db_postgres-1)
   ↓
Redis (:6379, 容器 docker-redis-1)
```

---

## 二、日常运维命令

### 查看容器状态
```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
```

### 查看应用日志
```bash
docker logs --tail=50 dahongshu_app
docker logs -f dahongshu_app           # 实时跟踪
```

### 重启应用
```bash
docker restart dahongshu_app
```

### 健康检查（手动）
```bash
curl -sf http://localhost:3100/ && echo "OK" || echo "FAIL"
curl -s http://localhost:3100/api/posts?limit=1 | python3 -m json.tool | head -5
```

---

## 三、数据库操作

### 连接数据库
```bash
docker exec -it docker-db_postgres-1 psql -U postgres -d dahongshu
```

### 常用 SQL
```sql
-- 查看数据量
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Post";
SELECT COUNT(*) FROM "Comment";

-- 查看用户
SELECT id, username, "createdAt" FROM "User" ORDER BY "createdAt";

-- 查看帖子（带作者）
SELECT p.id, p.title, u.username, p."createdAt"
FROM "Post" p
LEFT JOIN "User" u ON p."userId" = u.id
ORDER BY p."createdAt" DESC LIMIT 10;

-- 查看缺失 userId 的帖子（数据修复用）
SELECT id, title, "createdAt" FROM "Post" WHERE "userId" IS NULL;

-- 手动修复缺失列（如 viewCount）
ALTER TABLE "Post" ADD COLUMN "viewCount" integer NOT NULL DEFAULT 0;
```

### Prisma 操作
```bash
# 查看当前 schema 和数据库的差异
docker exec dahongshu_app npx prisma migrate status

# 强制同步 schema（开发/紧急时用）
docker exec dahongshu_app npx prisma db push --accept-data-loss

# 生成 Prisma Client
docker exec dahongshu_app npx prisma generate

# 执行 pending migrations
docker exec dahongshu_app npx prisma migrate deploy
```

---

## 四、部署流程

### 手动部署（紧急修复时用）
```bash
cd /home/chenjf/dahongshu
./deploy.sh
```

### 查看自动部署状态
```bash
cat /home/chenjf/.auto_deploy.log | tail -20
cat /home/chenjf/.auto_deploy_state          # 当前部署的 SHA
```

### 查看 entrypoint 迁移日志
```bash
docker exec dahongshu_app cat /app/.migration.log
```

---

## 五、磁盘与镜像清理

```bash
# 查看磁盘使用
df -h /

# 清理未使用镜像（释放空间）
docker image prune -f

# 清理所有未使用资源（谨慎）
docker system prune -a -f

# 查看 Docker 占用
docker system df
```

---

## 六、历史问题汇总

### 问题 1：API 返回 500 "No posts yet" — 数据库列缺失 ⭐

**现象**: 首页显示 "No posts yet"，但数据库有帖子数据。

**原因**: 代码 Prisma schema 新增了 `viewCount` 列，但迁移时只复制了数据，没有执行 `prisma migrate`，导致数据库表缺少该列。所有帖子查询报错 `Internal server error`。

**排查命令**:
```bash
docker logs --tail=10 dahongshu_app | grep -i error
curl -s http://localhost:3100/api/posts?limit=1
```

**修复**:
```sql
ALTER TABLE "Post" ADD COLUMN "viewCount" integer NOT NULL DEFAULT 0;
```

**预防**: 部署脚本和 entrypoint.sh 已加入 `prisma migrate deploy`。

---

### 问题 2：502 Bad Gateway — Prisma OpenSSL 不兼容

**原因**: Prisma 引擎需要完整 OpenSSL，`node:20-slim` 缺少。

**解决**: 改用 `node:20` 基础镜像。

---

### 问题 3：图片 404 — 上传目录未持久化

**原因**: `docker run` 缺少 `-v /home/chenjf/dahongshu_uploads:/app/public/uploads`。

**解决**: 每次重建容器必须带上 `-v` 参数。已在 `deploy.sh` 中固定。

---

### 问题 4：Visit / viewCount 模型不存在

**原因**: 根目录有残留的旧 `schema.prisma` 文件被 Prisma 优先读取。

**解决**: 删除根目录残留文件 `rm -f schema.prisma`。

---

### 问题 5：帖子详情页空白 — GET 处理器丢失

**原因**: 添加 DELETE 功能时覆盖了整个 `route.ts`，丢失了原有的 `GET` 函数。

**解决**: 确保每个 `[id]/route.ts` 同时导出 `GET` 和 `DELETE`。

---

### 问题 6：WebP 图片 404 — Nginx 正则优先级

**原因**: `location ~* \.(...webp)$` 优先于 `location /uploads/`，webp 被代理到 Next.js。

**解决**: 将 `/uploads/` 改为 `location ^~ /uploads/`（精确优先匹配）。

---

### 问题 7：.env 引号导致数据库连接失败

**原因**: `DATABASE_URL="postgresql://..."` 引号被 Docker 传入，导致 URL 前多了引号字符。

**解决**: `.env` 文件中不要给值加引号。

---

### 问题 8：服务器迁移后数据丢失

**原因**: pg_dump 只复制了数据，没有复制 schema 变更（migrations 目录）。

**解决**: 迁移时必须同时执行 `prisma migrate deploy`。

---

## 七、关键配置文件

| 文件 | 用途 |
|------|------|
| `/home/chenjf/dahongshu/entrypoint.sh` | 容器启动脚本（含自动 migration） |
| `/home/chenjf/dahongshu/deploy.sh` | 手动部署脚本 |
| `/home/chenjf/dahongshu/.env.prod` | 生产环境变量 |
| `/home/chenjf/dahongshu/prisma/schema.prisma` | 数据库模型 |
| `/home/chenjf/auto_deploy.sh` | 自动部署脚本（不在 Git） |
| `/home/chenjf/.auto_deploy.log` | 自动部署日志 |

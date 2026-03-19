# 大红书 (DaHongShu) — 运维排障手册

> 最后更新: 2026-03-11  
> 服务器: `106.13.37.169` (Ubuntu)  
> 域名: `dahongshu.ai1717.cn`  
> SSH: `root` / `Chenjf8018`

---

## 一、架构概览

```
用户浏览器 → Nginx(:80) → Next.js(:3100) → PostgreSQL(:5432)
                ↓
        /uploads/ 静态文件直接返回
```

| 组件 | 技术栈 | 容器名 |
|------|--------|--------|
| 应用服务 | Next.js 16 + Node 20 | `dahongshu_app` |
| 数据库 | PostgreSQL | `dahongshu_postgres` |
| 反向代理 | Nginx (宿主机) | — |
| ORM | Prisma 5.22 | — |

### 关键路径

| 路径 | 说明 |
|------|------|
| `/root/dahongshu/` | 服务器项目根目录 |
| `/root/dahongshu/.env` | 容器环境变量 |
| `/root/dahongshu/prisma/schema.prisma` | 数据库模型定义 |
| `/home/dahongshu_uploads/` | 用户上传图片（宿主机持久化） |
| `/etc/nginx/sites-enabled/dahongshu.ai1717.cn.conf` | Nginx 配置 |

---

## 二、常用运维命令

### 标准重建流程

```bash
# 1. 本地同步代码到服务器
rsync -avz src/ -e 'sshpass -p "Chenjf8018" ssh -o StrictHostKeyChecking=no' \
  root@106.13.37.169:/root/dahongshu/src/

# 2. 在服务器上构建镜像
cd /root/dahongshu && docker-compose build app

# 3. 重建容器（⚠️ 必须带 -v 挂载 uploads 目录）
docker rm -f dahongshu_app
docker run -d --name dahongshu_app \
  --restart always \
  -p 3100:3100 \
  --network dahongshu_default \
  --env-file /root/dahongshu/.env \
  -v /home/dahongshu_uploads:/app/public/uploads \
  dahongshu_app

# 4. 同步数据库 Schema（如有新表/字段变动）
docker exec dahongshu_app npx prisma db push
```

### 查看日志

```bash
docker logs --tail=100 dahongshu_app
docker logs -f dahongshu_app        # 实时跟踪
```

### 磁盘空间清理

```bash
docker system prune -a -f           # 清除全部未使用镜像/容器
docker volume prune -f              # 清除孤立卷
df -h                               # 查看磁盘使用
```

---

## 三、历史问题汇总与解决方案

### 问题 1：502 Bad Gateway — Prisma OpenSSL 不兼容

**现象**: 站点 502，容器日志报 `PrismaClientInitializationError`，找不到 OpenSSL 库。

**原因**: Prisma 引擎需要特定的 OpenSSL 二进制版本，`node:20-slim` 缺少这些库。

**解决**:
- `prisma/schema.prisma` 中添加 `binaryTargets = ["native", "debian-openssl-3.0.x"]`
- `Dockerfile` 基础镜像从 `node:20-slim` 改为 `node:20`（包含完整系统库）

---

### 问题 2：图片 404 — 上传目录未持久化

**现象**: 发帖后图片无法显示，返回 404。

**原因**: `docker run` 命令缺少 `-v` 卷挂载参数，上传文件保存在容器内部，Nginx 无法从宿主机 `/home/dahongshu_uploads/` 读取。

**解决**:
```bash
# ⚠️ 每次重建容器必须添加此参数
docker run ... -v /home/dahongshu_uploads:/app/public/uploads ...
```

> [!CAUTION]
> 这是最容易遗漏的问题。每次 `docker rm` + `docker run` 都必须带上 `-v` 参数，否则图片全部丢失。

---

### 问题 3：Visit 统计模型不存在 — 残留 schema 文件

**现象**: `/admin/stats` 报 `Visit model not initialized in Prisma` 或 `The table public.Visit does not exist`。

**原因**: 服务器根目录有一个旧的 `schema.prisma` 文件（不含 Visit 模型），Prisma 优先读取根目录的 schema，忽略 `prisma/schema.prisma`。

**解决**:
1. 删除根目录的残留文件：`rm -f /root/dahongshu/schema.prisma`
2. 确认只有 `prisma/schema.prisma` 存在
3. 重建镜像：`docker-compose build app`
4. 同步数据库：`docker exec dahongshu_app npx prisma db push`

---

### 问题 4：.env 引号导致数据库连接失败

**现象**: 所有 API 报 `Error validating datasource: the URL must start with postgresql://`。

**原因**: Docker `--env-file` 会把引号当作值的一部分。`.env` 文件写成 `DATABASE_URL="postgresql://..."` 时，实际传入的值是 `"postgresql://..."` (带引号)，不是合法的 URL。

**解决**:
```bash
# .env 中不要使用引号
DATABASE_URL=postgresql://postgres:postgres@dahongshu_postgres:5432/dahongshu?schema=public
JWT_SECRET=dahongshu_super_secret_dev_key_2026
NEXT_PUBLIC_API_URL=http://localhost:3100
```

> [!IMPORTANT]
> Docker `--env-file` 和 shell 的 `.env` 行为不同。Docker 不会自动去掉引号。

---

### 问题 5：帖子详情页空白 — GET 处理器丢失

**现象**: 点击任意帖子，详情页空白/加载失败。API 返回 `405 Method Not Allowed`。

**原因**: 添加帖子删除功能时，`src/app/api/posts/[id]/route.ts` 被整体覆盖，只保留了 `DELETE` 处理器，原有的 `GET` 处理器丢失。

**解决**: 在同一个 `route.ts` 文件中同时导出 `GET` 和 `DELETE` 两个函数。

---

### 问题 6：WebP 图片 404 — Nginx 正则优先级

**现象**: `.webp` 格式的上传图片返回 404，但 `.png` 正常。

**原因**: Nginx 配置中 `location ~* \.(ico|css|js|...|webp)$` 的正则匹配优先于 `location /uploads/`，导致 webp 请求被代理到 Next.js 而非直接从磁盘读取。

**解决**: 将 `/uploads/` location 改为 `^~` 前缀（优先精确匹配）：
```nginx
location ^~ /uploads/ {
    alias /home/dahongshu_uploads/;
    ...
}
```

---

### 问题 7：Docker 构建失败 — 磁盘空间不足

**现象**: `docker-compose build` 报 `ERR_PNPM_ENOSPC`。

**原因**: 多次 `--no-cache` 构建产生大量悬空镜像，磁盘被填满。

**解决**:
```bash
docker system prune -a -f   # 清理回收空间
docker-compose build app     # 重新构建
```

---

### 问题 8：apt-get 签名错误 — Docker 基础镜像

**现象**: Dockerfile 中 `apt-get update` 报 GPG 签名验证失败。

**原因**: `node:20-slim` 基于 Debian bookworm，某些镜像源签名过期。

**解决**: 将基础镜像从 `node:20-slim` 改为 `node:20`（完整版，无需额外 apt-get）。

---

### 问题 9：Next.js 开发模式在生产环境运行

**现象**: 容器日志显示 Turbopack dev server 信息，性能差。

**原因**: `server.mjs` 中 `const dev = process.env.NODE_ENV !== 'production'`，但容器没有设置 `NODE_ENV`。

**解决**: 在 `Dockerfile` 中显式设置：
```dockerfile
ENV NODE_ENV=production
RUN pnpm build
```

---

### 问题 10：Next.js 16 动态路由 params 类型错误

**现象**: `docker-compose build` 时 TypeScript 编译报错：`Type 'string' is not assignable...`

**原因**: Next.js 16 要求动态路由的 `params` 类型为 `Promise<{ id: string }>`，需要 `await`。

**解决**:
```typescript
// ❌ 旧写法
export async function DELETE(req, { params }: { params: { id: string } }) {
    const { id } = params;

// ✅ 新写法 (Next.js 16)
export async function DELETE(req, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
```

---

## 四、.dockerignore 配置

防止本地缓存泄漏到 Docker 构建中：

```
node_modules
.next
.git
.env
public/uploads
```

> [!WARNING]
> 如果没有 `.dockerignore`，本地的 `.next` 缓存会被 COPY 进镜像，导致 Prisma Client 使用旧的 schema 生成结果。

---

## 五、Dockerfile 参考

```dockerfile
FROM node:20
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm config set registry https://registry.npmmirror.com && pnpm install
COPY . .
RUN pnpm prisma generate
ENV NODE_ENV=production
RUN pnpm build
EXPOSE 3100
CMD ["node", "server.mjs"]
```

---

## 六、Nginx 配置参考

```nginx
server {
    listen 80;
    server_name dahongshu.ai1717.cn;
    client_max_body_size 50M;

    # ⚠️ ^~ 确保上传文件优先于正则匹配
    location ^~ /uploads/ {
        alias /home/dahongshu_uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location ~* \.(ico|css|js|gif|jpe?g|png|svg|webp)$ {
        proxy_pass http://localhost:3100;
        proxy_set_header Host $host;
        expires 30d;
    }

    location / {
        proxy_pass http://localhost:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

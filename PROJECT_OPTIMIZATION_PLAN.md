# 小红虾（xiaohongxia）平台优化方案
> 生成时间：2026-01-09 | 状态：Phase 1-3 代码已完成并推送到 GitHub

---

## 📊 现状分析

### 平台架构
- **技术栈**：Next.js 14 (App Router) + PostgreSQL + Prisma + Tailwind CSS
- **域名**：
  - xiaohongxia.aiduno.cc（主域名）
  - xiaohongxia.ai1717.cn（次域名，未配置）
- **部署**：192.168.71.128（内网服务器），Next.js standalone 模式

### 已有功能
✅ 用户注册/登录（JWT）、个人主页
✅ 帖子发布（文字+图片）、评论
✅ 点赞功能
✅ AI 账号体系（OpenClaw）
✅ 管理后台、访问统计

### 已知问题
❌ **关注按钮无效** — 前端点了没调用 API
❌ **评论列表不显示** — Detail 页面评论 0 显示
❌ **MIME 类型乱码** — 上传图片后显示异常
❌ **移动端体验差** — 导航栏在小屏上布局混乱

---

## 🗺️ 优化路线图（5个阶段）

### ✅ Phase 1：Bug 修复（已完成）
**文件修改：**
- `app/post/[id]/page.tsx` — Follow 按钮 + 评论数显示
- `app/profile/[id]/page.tsx` — Follow 按钮 API 调用

### ✅ Phase 2：新功能（已完成）
**新 API：**
- `api/search/route.ts` — 全局搜索（用户 + AI账号 + 内容）
- `api/collections/route.ts` — 收藏夹 CRUD
- `api/notifications/route.ts` — 通知中心（支持全部已读）
- `api/posts/following/route.ts` — 关注者动态流

**新页面：**
- `/search` — 全局搜索页（Tab: 全部/用户/内容）
- `/collections` — 我的收藏页
- `/notifications` — 消息通知中心
- `/settings` — 个人资料编辑页

**数据库 Schema 变更：**
- 新增 `CollectionItem` 模型（收藏）
- 新增 `Notification` 模型（通知）
- 新增 `InviteCode` 模型（邀请码）
- 新增 `Visit` 模型（访问记录）

### ✅ Phase 3：用户体验优化（已完成）
**前端改进：**
- 首页 Feed 支持「推荐」「关注」双 Tab
- 导航栏新增：🔔 通知入口、📚 收藏入口、⚙️ 设置入口、🔍 搜索入口
- 个人主页：自己的页面显示「编辑资料」按钮
- Profile 页显示真实粉丝数/文章数

### ⏳ Phase 4：域名配置（待部署）
**文件已生成：** `nginx-ai1717.cn.conf`

```nginx
server {
    listen 80;
    server_name xiaohongxia.ai1717.cn;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**部署步骤：**
```bash
# 1. SSH 到服务器
ssh root@192.168.71.128

# 2. 复制 Nginx 配置
scp nginx-ai1717.cn.conf root@192.168.71.128:/etc/nginx/sites-available/xiaohongxia.ai1717.cn.conf
ln -s /etc/nginx/sites-available/xiaohongxia.ai1717.cn.conf /etc/nginx/sites-enabled/

# 3. 测试并重载 Nginx
nginx -t && nginx -s reload
```

### ⏳ Phase 5：自动化部署（GitHub Actions）
**文件已生成：** `.github/workflows/deploy.yml`

**使用前提：**
在 GitHub 仓库 Settings → Secrets 中配置：
- `DATABASE_URL` — PostgreSQL 连接字符串
- `JWT_SECRET` — JWT 密钥
- `OPENAI_API_KEY` — OpenAI API Key（可选）
- `SERVER_HOST` — 192.168.71.128
- `SERVER_USER` — root
- `SERVER_SSH_KEY` — SSH 私钥（用于无密码部署）

**触发方式：** 推送代码到 `main` 分支自动部署，或手动触发 Workflow

---

## 📁 完整文件清单

```
xiaohongxia/
├── .github/workflows/deploy.yml        ✅ GitHub Actions 部署
├── docker-compose.yml                  ✅ Docker 部署配置
├── nginx-ai1717.cn.conf               ✅ 域名配置
│
├── prisma/schema.prisma               ✅ 新增字段
│
├── src/app/
│   ├── search/page.tsx                ✅ 搜索页
│   ├── collections/page.tsx           ✅ 收藏页
│   ├── notifications/page.tsx         ✅ 通知中心
│   ├── settings/page.tsx              ✅ 资料编辑
│   ├── post/[id]/page.tsx             ✅ Bug修复
│   ├── profile/[id]/page.tsx          ✅ Bug修复+编辑按钮
│   ├── page.tsx                       ✅ Feed Tab
│   └── api/
│       ├── search/route.ts            ✅ 搜索API
│       ├── collections/route.ts       ✅ 收藏API
│       ├── notifications/route.ts     ✅ 通知API
│       └── posts/following/route.ts   ✅ 关注动态API
```

---

## 🔧 手动部署步骤（SSH 可用后）

```bash
# 1. 在 192.168.71.128 服务器上
cd /var/www/xiaohongxia

# 2. 拉取最新代码
git pull origin main

# 3. 安装依赖并构建
cd src
npm ci
npx prisma migrate deploy
DATABASE_URL="postgresql://..." JWT_SECRET="..." npm run build

# 4. 重启服务
pm2 restart xiaohongxia

# 5. 配置第二个域名
scp nginx-ai1717.cn.conf root@192.168.71.128:/etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/xiaohongxia.ai1717.cn.conf /etc/nginx/sites-enabled/
nginx -t && nginx -s reload
```

---

## 🎯 后续可添加的功能建议

### 短期（1-2周）
1. **SEO 优化** — Open Graph 标签、sitemap、robots.txt
2. **图片 CDN** — 接入 Cloudflare R2 或阿里云 OSS
3. **移动端 PWA** — manifest + service worker，支持添加到主屏幕
4. **私信系统** — 用户之间一对一聊天

### 中期（1个月）
5. **AI 内容标注** — AI 发的帖子/评论自动打上「AI生成」标签
6. **内容举报/审核** — 举报按钮 + 管理后台审核流
7. **话题/标签系统** — 帖子打标签，标签页聚合
8. **热门内容榜单** — 日/周/月点赞/浏览 Top 10

### 长期（3个月+）
9. **创作者等级系统** — 根据影响力（粉丝/互动）分级
10. **付费内容** — 付费订阅查看专属内容
11. **小程序适配** — 微信小程序版本
12. **推荐算法** — 基于用户行为的个性化内容推荐

---

## 📋 待确认事项

1. **SSH 部署方式** — 需要提供正确的用户名/密钥或密码
2. **数据库迁移** — 新增 `CollectionItem`、`Notification` 表需要运行 `prisma migrate deploy`
3. **通知图标** — 需要设计未读红点样式（目前用文字"未读 X"）
4. **是否需要 HTTPS** — ai1717.cn 域名是否需要配置 SSL 证书

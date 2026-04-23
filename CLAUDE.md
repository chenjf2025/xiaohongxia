# 小红虾项目 Claude Code 配置

## 当前状态 (2026-03-20)

### 服务器 1 (云服务器) - 公网

| 项目 | 值 |
|------|-----|
| IP | 106.13.37.169 |
| SSH 用户名 | root |
| SSH 密码 | Chenjf8018 |
| 域名 | xiaohongxia.ai1717.cn |
| 应用端口 | 3100 |
| Docker 容器 | dahongshu_app, dahongshu_postgres |
| 数据库密码 | AsdfRewq!@#$ ⚠️ |

### 服务器 2 (本地/内网)

| 项目 | 值 |
|------|-----|
| IP | 192.168.71.127 |
| SSH 用户名 | chenjf |
| SSH 密码 | chenjf8018 |
| 域名 | xiaohongxia.aiduno.cc |
| 应用端口 | 3100 |
| Docker 容器 | dahongshu_app, dahongshu_postgres |
| 数据库密码 | postgres |

### 本地开发 (Docker Desktop)

| 项目 | 值 |
|------|-----|
| 应用端口 | 3100 |
| 数据库密码 | postgres |

## ⚠️ 重要教训

### 数据库密码问题
- 密码 `AsdfRewq!@#$` 包含特殊字符，在 Docker --env-file 传递时会有编码问题
- 服务器1使用该密码，但传递过程复杂
- 服务器2和本地使用简单密码 `postgres`

### 部署步骤
1. 同步代码和 package.json, pnpm-lock.yaml
2. 在服务器上构建镜像
3. 重启容器，确保 .env 中的密码与数据库密码一致

## 配置文件

- `.env` - 应用环境变量
- `.pgenv` - PostgreSQL 环境变量

## 数据库连接

### 服务器 1
```
DATABASE_URL=postgresql://postgres:AsdfRewq!@#$@dahongshu_postgres:5432/dahongshu?schema=public
```

### 服务器 2 / 本地
```
DATABASE_URL=postgresql://postgres:postgres@dahongshu_postgres:5432/dahongshu?schema=public
```

## 常用部署命令

### 服务器 1 部署
```bash
# 1. 同步代码
scp -r src root@106.13.37.169:/root/dahongshu/
scp package.json pnpm-lock.yaml root@106.13.37.169:/root/dahongshu/

# 2. 构建启动
ssh root@106.13.37.169 "cd /root/dahongshu && docker-compose build --no-cache && docker-compose up -d"
```

### 服务器 2 部署
```bash
# 1. 同步代码
scp -r src chenjf@192.168.71.127:~/dahongshu/
scp package.json pnpm-lock.yaml chenjf@192.168.71.127:~/dahongshu/

# 2. 构建
ssh chenjf@192.168.71.127 "cd ~/dahongshu && docker build --no-cache -t dahongshu_app ."

# 3. 启动（需挂载上传目录）
ssh chenjf@192.168.71.127 "docker stop dahongshu_app && docker rm dahongshu_app && docker run -d --name dahongshu_app --network dahongshu_default -p 3100:3100 --env-file /home/chenjf/dahongshu/.env -v /home/chenjf/dahongshu_uploads:/app/public/uploads dahongshu_app"
```

## 数据库连接问题排查

### 排查步骤
```bash
# 1. 检查 .env 中的密码
cat /path/to/.env | grep DATABASE

# 2. 检查容器内的环境变量
docker exec dahongshu_app env | grep DATABASE

# 3. 检查数据库实际密码
docker exec dahongshu_postgres psql -U postgres -c "SELECT rolname FROM pg_authid WHERE rolname='postgres';"
```

### 解决方案

**方案 A: 修改 PostgreSQL 认证方式为 trust（推荐）**
```bash
docker exec dahongshu_postgres sed -i 's/host all all all scram-sha-256/host all all all trust/' /var/lib/postgresql/data/pg_hba.conf
docker exec dahongshu_postgres psql -U postgres -c 'SELECT pg_reload_conf();'
docker restart dahongshu_app
```

**方案 B: 同步密码**
```bash
# 修改数据库密码
docker exec dahongshu_postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD '你的密码';"

# 更新 .env 中的 DATABASE_URL
# 然后重启容器
docker restart dahongshu_app
```

**注意**: 如果使用包含特殊字符的密码（如 `!@#$`），Docker --env-file 传递时可能有编码问题，建议使用简单密码。

## 已完成功能

- [x] 用户系统 (注册/登录/邀请码)
- [x] 内容系统 (发帖/图片/标签)
- [x] 互动功能 (点赞/评论/关注)
- [x] OpenClaw API (发帖/搜索)
- [x] Markdown 支持帖子内容

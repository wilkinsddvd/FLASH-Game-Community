# FLASH 上云部署说明（数据库 / Redis / Docker）

> 整理时间：2026-09-07
> 适用：FLASH Game Community（FastAPI 后端 + Vue3/Vite 前端）

---

## 1. 数据库：本地库 ↔ 云端库 双环境切换（需求：本地测试用本地库，上云用云端库）

### 1.1 原理

后端 `db/db.py` 根据环境变量 `DB_ENV` 选择连接串：

| DB_ENV | 使用的变量 | 驱动 | 说明 |
|---|---|---|---|
| `local`（默认） | `DATABASE_URL` | `aiomysql` | 本地 MySQL |
| `cloud` / `production` | `CLOUD_DATABASE_URL` | `asyncmy` | 云端 MySQL（阿里云等） |

`.env`（FLASH_END_PRO/.env）中两者并存：

```dotenv
# 本地库（开发默认）
DATABASE_URL=mysql+aiomysql://root:123456@localhost:3306/flash_game_community

# 部署模式：local=本地库 / cloud=云端库（上云时改为 cloud）
DB_ENV=local

# 云端库（密码含 @ 需转义为 %40；库名按云端实际修改）
CLOUD_DATABASE_URL=mysql+asyncmy://root:Root123%40@39.96.182.141:3306/flash_game_community
```

> `core/config.py` 的 `Settings` 已同步声明 `db_env` / `cloud_database_url` 两个字段（pydantic 不允许多余键）。
> `requirements.txt` 已加入 `asyncmy>=0.2.0`。

### 1.2 上云切换步骤

1. 云端创建数据库（如 `flash_game_community`，utf8mb4），放通安全组 3306（仅对后端服务器 IP 开放）。
2. 把服务器上 `DB_ENV` 设为 `cloud`，并把 `CLOUD_DATABASE_URL` 改为真实库名/密码。
3. 首次上云执行一次建表：在服务器后端目录 `DB_ENV=cloud python3 reset_db.py --cloud-ack`（会清空云端库并建表 + 写入初始口令），或手动执行 `init_db` 建表。
4. 后续本地开发照常 `DB_ENV=local`，互不影响。

---

## 2. Redis：云端需要吗？（需求 7 分析）

### 2.1 结论：**建议准备**（单机可降级，多实例/正式上云强烈建议）

项目代码已内置 Redis 依赖与连接模块（`core/redis.py`），并且**以下功能已实际依赖 Redis**：

| 功能 | Redis 用法 | Redis 挂了会怎样 |
|---|---|---|
| 管理员口令防爆破 | 按 IP 记录失败次数、30 分钟锁定 | 管理员注册接口直接报错 |
| 邮箱验证码 | 存验证码（5 分钟 TTL）+ 发送频率限制 | 发码/校验验证码功能不可用 |
| 其他（可扩展） | token 黑名单 / 站点缓存等 | — |

也就是说：**不是“用不用 Redis”的问题，而是代码已经写了依赖**。本地开发时你本机有 Redis（localhost:6379）所以没感觉；上云若不开 Redis，管理员注册与邮箱验证码会不可用。

### 2.2 对接方式（三选一）

**方案 A（推荐，最省事）：云服务器 Docker 起一个 Redis**
```bash
docker run -d --name flash-redis --restart unless-stopped \
  -p 6379:6379 \
  -v flash_redis:/data \
  redis:7-alpine redis-server --appendonly yes --requirepass <你的密码>
```
后端环境变量：
```dotenv
REDIS_URL=redis://<服务器内网IP或redis容器名>:6379/0
REDIS_PASSWORD=<你的密码>
```
（若后端也在 Docker 里并同网络，`REDIS_URL=redis://flash-redis:6379/0`）

**方案 B：直接用云厂商 Redis**（阿里云云数据库 Redis / 腾讯云），把上面的 `REDIS_URL`、`REDIS_PASSWORD` 换成实例地址与密码即可，代码零改动。

**方案 C：单机小流量先不装** —— 需改代码把 Redis 调用改为可降级（try/except 兜底 + 内存版计数），工作量约 0.5 天，不建议为上云临时做，直接上方案 A 最快。

### 2.3 建议清单
- [ ] 云服务器/云厂商准备 Redis，记录 `REDIS_URL` 与 `REDIS_PASSWORD`
- [ ] 后端 `.env`（或容器环境变量）写入上述两项
- [ ] Redis 只对后端服务器内网开放（不要暴露公网 6379）
- [ ] 本地开发保持不变（localhost:6379 无密码）

---

## 3. Docker 镜像（需求 6：Dockerfile 已分别就位）

- 后端：`FLASH_END_PRO/Dockerfile`（python:3.12-slim，gcc 编译 bcrypt，uvicorn 生产启动）
- 前端：`frontend/Dockerfile`（node:20 构建 → nginx:alpine 托管 + `/api` 反代到后端）
- `.dockerignore` 已排除 `.env`（后端，防泄密）、`node_modules/dist`（前端）

本地构建：
```bash
# 后端
cd FLASH_END_PRO && docker build -t flash-backend .
# 前端
cd frontend && docker build -t flash-frontend --build-arg VITE_API_BASE_URL=/api .
```

本地一键起（docker-compose，MySQL+后端+前端，DB 在 3307）：
```bash
docker compose up -d --build
```

云端部署建议（compose 或单容器均可）：
```bash
docker run -d --name flash-backend --restart unless-stopped -p 8000:8000 \
  -e DB_ENV=cloud \
  -e CLOUD_DATABASE_URL='mysql+asyncmy://root:Root123%40@<云RDS地址>:3306/flash_game_community' \
  -e SECRET_KEY='<换成强随机串>' \
  -e REDIS_URL='redis://flash-redis:6379/0' \
  -e REDIS_PASSWORD='<你的密码>' \
  -v flash_uploads:/app/uploads \
  flash-backend

docker run -d --name flash-frontend --restart unless-policy -p 80:80 flash-frontend
```

> 提醒：`SECRET_KEY`、SMTP 密码等上云务必换成生产值；`.env` 不入镜像（已 .dockerignore）。

---

## 4. 上线前检查清单
- [ ] 云端 MySQL 建库 + 安全组只放行后端 IP
- [ ] `DB_ENV=cloud` + `CLOUD_DATABASE_URL` 正确
- [ ] 首次建表：`DB_ENV=cloud python3 reset_db.py --cloud-ack`（或等价 init）
- [ ] Redis 就绪并配置 `REDIS_URL/REDIS_PASSWORD`
- [ ] 初始口令「闪电的战术大队」「天空那道闪电」各可用 3 次——上线后尽快在后台改成高强度口令并妥善保存
- [ ] 前端 `/api` 反代指向后端容器；域名 + HTTPS
- [ ] 上传目录（uploads）用 volume 持久化

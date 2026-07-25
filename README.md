# FLASH-Game-Community ⚡

面向游戏玩家的社区平台，以社交互动为核心，提供资讯获取、内容创作、交流讨论的一站式服务。

## 技术栈

| 层级 | 技术 | 说明 |
|:---|:---|:---|
| 前端 (C端) | Vue 3 + Vite + Pinia + Vue Router | 社区类项目生态丰富 |
| 前端 (Admin) | Vue 3 + Element Plus | 统一技术栈，降低维护成本 |
| 后端 | Python FastAPI + Pydantic v2 | 异步高性能，自动生成 API 文档 |
| ORM | SQLAlchemy 2.0 | 支持异步会话 |
| 数据库 | MySQL 8.0+ | InnoDB, utf8mb4 |

## 一期模块

- **用户登录注册模块** — 用户名+密码登录、JWT 认证、bcrypt 加密
- **用户管理模块 (RBAC)** — RBAC2 角色继承模型，角色/权限/用户管理
- **论坛模块** — 板块管理、发帖回帖、点赞收藏、搜索、软删除
- **静态信息展示模块** — Banner 轮播、游戏资讯、关于我们/社区规则

## 快速启动

### 后端

```bash
cd FLASH_END_PRO

# 安装依赖
pip install -r requirements.txt

# 配置数据库
export DATABASE_URL='mysql+pymysql://user:pass@127.0.0.1:3306/flash_game_community'

# 启动服务
uvicorn main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

## API 文档

启动后端后访问 `http://localhost:8000/docs` 查看 Swagger 文档。

## 部署

使用 Docker 部署：

```bash
docker compose up -d
```

## 项目结构

```
FLASH/
├── frontend/                # Vue 3 前端
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   ├── components/     # 通用组件
│   │   ├── router.js       # 路由配置
│   │   ├── api.js          # API 调用
│   │   └── style.css       # 全局样式
│   └── ...
├── FLASH_END_PRO/           # FastAPI 后端
│   ├── main.py             # 应用入口
│   ├── model/              # SQLAlchemy 模型
│   ├── api/                # API 路由
│   ├── db/                 # 数据库配置
│   └── ...
├── docker-compose.yml      # Docker 编排
└── README.md
```

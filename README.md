# FLASH-Game-Community

基于 **FastAPI + Vue3 + MySQL(可通过 `DATABASE_URL` 配置)** 的前后端分离游戏社区示例。

## 已实现模块

- 静态展示页：`display` / `guide` / `developer`
- 最高权限 `admin` 在前端对展示内容进行 CRUD
- RBAC 角色：`admin` / `operater` / `gamer` / `unknown`
- 论坛发帖、置顶、撤回权限控制

## 后端启动

```bash
cd backend
pip install -r requirements.txt
# MySQL 示例：export DATABASE_URL='mysql+pymysql://<user>:<pass>@127.0.0.1:3306/flash_game_community'
uvicorn app.main:app --reload
```

## 前端启动

```bash
cd frontend
npm install
npm run dev
```

默认调用后端 `http://localhost:8000/api`，可通过 `VITE_API_BASE_URL` 覆盖。

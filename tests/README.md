# FLASH 测试套件

> 功能：Selenium（浏览器）+ pytest（API）；压测：Locust。
> 只在本地/staging 跑；**严禁对生产压测**。

## 前置

```bash
# 后端依赖（含 selenium/pytest/httpx/locust）
/opt/homebrew/Caskroom/miniconda/base/envs/FLASH_END_PRO/bin/pip install -r FLASH_END_PRO/requirements-dev.txt

# 启动本地/staging
# 方式 A：现有本地开发栈（后端 8000 / 前端 3001）
# 方式 B：独立 staging（独立库/Redis，端口 8001/3002）
#   docker compose -f docker-compose.test.yml up -d --build
#   E2E_BASE_URL=http://localhost:3002 API_BASE_URL=http://localhost:8001 ...
```

Selenium 需要 Chrome/Chromium；默认自动找 `~/Library/Caches/ms-playwright` 下的 Chromium，也可用 `CHROME_BIN` 指定。

## 一键跑

```bash
bash scripts/test-all.sh
```

## 分开跑

```bash
# API
API_BASE_URL=http://localhost:8000 pytest tests/api -q

# Selenium（桌面 + 移动模拟）
E2E_BASE_URL=http://localhost:3001 pytest tests/e2e -q

# 只跑某个需求
pytest tests/e2e/test_points.py -q
pytest tests/e2e/test_fire_control.py -q

# Locust：API
cd FLASH_END_PRO
LOCUST_TOKENS="$(python tests/load/prepare_tokens.py --count 5 --create --csv)" \
  locust -f tests/load/locustfile.py --headless -u 10 -r 2 -t 30s \
  --host http://localhost:8000 --csv ../tests/reports/api-u10 --html ../tests/reports/api-u10.html

# Locust：前端静态资源
locust -f tests/perf/locust_static.py --headless -u 20 -r 5 -t 30s \
  --host http://localhost:3001 --csv tests/reports/static-u20 --html tests/reports/static-u20.html

# 阈值检查
python tests/perf/check_thresholds.py tests/reports/api-u50_stats.csv
```

## 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:3001` | 前端 |
| `API_BASE_URL` | `http://localhost:8000` | 后端 |
| `E2E_ADMIN_TOKEN` | 自动生成 | 后台用例；无 super_admin 时跳过 |
| `CHROME_BIN` | 自动查找 | Chromium/Chrome 路径 |
| `P95_MS` / `FAIL_RATIO` | 300 / 0.001 | 压测阈值 |

## 产物

- 失败截图/浏览器日志：`tests/reports/`
- Locust CSV/HTML：`tests/reports/`
- 体积门禁输出：终端 + 退出码

## 注意

- Selenium 后台 Banner 用例会创建并删除测试 Banner；不会留在库里
- Locust 会创建 `loadtest_*` 用户和留言；只在测试库跑
- 生产只做只读巡检，不做压测

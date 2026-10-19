# Locust 压测

> 只压本地/staging；生产只读巡检，不压测。

## API

```bash
cd FLASH_END_PRO
LOCUST_TOKENS="$(python tests/load/prepare_tokens.py --count 5 --create --csv)" \
  locust -f tests/load/locustfile.py --headless -u 50 -r 5 -t 30s \
  --host http://localhost:8000 \
  --csv ../tests/reports/api-u50 --html ../tests/reports/api-u50.html
```

## 前端静态资源

```bash
locust -f tests/perf/locust_static.py --headless -u 20 -r 5 -t 30s \
  --host http://localhost:3001 \
  --csv tests/reports/static-u20 --html tests/reports/static-u20.html
```

## 阈值

```bash
python tests/perf/check_thresholds.py tests/reports/api-u50_stats.csv
# P95_MS=300 FAIL_RATIO=0.001 可覆盖
```

## 阶梯建议

- 基线：1 并发 1 分钟
- 阶梯：10 / 50 / 100 / 200，每档 3 分钟
- 长稳：拐点 60–70% 并发，30 分钟

## 2026-10-20 基线（本地）

- API 50 并发：971 请求，0 失败，p95 46ms，p99 65ms，32.6 RPS
- 静态 20 并发：484 请求，0 失败，p95 10ms

#!/usr/bin/env bash
# FLASH 测试总入口（本地/staging）
# 用法：bash scripts/test-all.sh [--with-locust]
set -euo pipefail
cd "$(dirname "$0")/.."

PY="${PYTHON_BIN:-/opt/homebrew/Caskroom/miniconda/base/envs/FLASH_END_PRO/bin/python}"
BASE="${E2E_BASE_URL:-http://localhost:3001}"
API="${API_BASE_URL:-http://localhost:8000}"

echo "== 1. 前端构建 =="
(cd frontend && npm run build)

echo "== 2. 数据/算法自检 =="
node scripts/test-raas-solver.mjs
node scripts/test-roster-groups.mjs
node scripts/test-vehicle-stats.mjs
node scripts/test-fire-control.mjs

echo "== 3. 构建体积门禁 =="
node scripts/check-bundle-size.mjs

echo "== 4. API 功能测试（$API） =="
API_BASE_URL="$API" "$PY" -m pytest tests/api -q

echo "== 5. 路由快速切换回归（$BASE） =="
RAAS_UI_BASE="$BASE" node scripts/test-route-nav.mjs

echo "== 6. Selenium 功能测试（$BASE） =="
E2E_BASE_URL="$BASE" API_BASE_URL="$API" "$PY" -m pytest tests/e2e -q

if [[ "${1:-}" == "--with-locust" ]]; then
  echo "== 7. Locust 基线（5 并发 30s） =="
  mkdir -p tests/reports
  "$PY" tests/perf/check_thresholds.py tests/reports/api-baseline_stats.csv 2>/dev/null || true
  echo "如需重新压测，见 tests/perf/README.md"
fi

echo "✅ 测试完成"

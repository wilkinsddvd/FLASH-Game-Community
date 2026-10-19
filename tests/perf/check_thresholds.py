#!/usr/bin/env python3
"""
读取 Locust CSV 并做阈值检查

用法：
  python tests/perf/check_thresholds.py tests/reports/api_stats.csv

阈值（可用环境变量覆盖）：
  P95_MS=300  FAIL_RATIO=0.001
"""
import csv
import os
import sys
from pathlib import Path

P95 = float(os.getenv("P95_MS", "300"))
FAIL_RATIO = float(os.getenv("FAIL_RATIO", "0.001"))


def main():
    if len(sys.argv) < 2:
        print("用法: check_thresholds.py <stats.csv>")
        return 2
    path = Path(sys.argv[1])
    if not path.exists():
        print(f"❌ 找不到 {path}")
        return 2
    rows = list(csv.DictReader(path.open()))
    agg = next((r for r in rows if r.get("Name") == "Aggregated"), None)
    if not agg:
        print("❌ CSV 中没有 Aggregated 行")
        return 2

    total = int(agg["Request Count"])
    failed = int(agg["Failure Count"])
    p95 = float(agg["95%"])
    ratio = failed / total if total else 0
    print(f"总请求 {total} · 失败 {failed} ({ratio:.3%}) · p95 {p95:.0f}ms")
    ok = True
    if p95 > P95:
        print(f"❌ p95 {p95:.0f}ms > {P95:.0f}ms")
        ok = False
    if ratio > FAIL_RATIO:
        print(f"❌ 失败率 {ratio:.3%} > {FAIL_RATIO:.3%}")
        ok = False
    print("✅ 阈值通过" if ok else "❌ 阈值未通过")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())

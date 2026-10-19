#!/usr/bin/env python3
"""
高程数据构建：squadcalc JSON → int16 .bin + 前端 meta

用法：
  python3 scripts/build-heightmaps.py /tmp/heightmaps

输入：<slug>.json（500×500，米）
输出：
  frontend/public/squad-assets/heightmaps/<slug>.bin
  frontend/src/data/squad/heightmaps-meta.js

.bin 格式：500×500 int16 little-endian，行优先，行 0 = 北边（ymin）
数值 = round(米 × 10)，即 0.1m 精度。
"""
import json
import sys
from pathlib import Path
import struct

REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / "frontend" / "public" / "squad-assets" / "heightmaps"
META = REPO / "frontend" / "src" / "data" / "squad" / "heightmaps-meta.js"

# 前端地图 key（squadmaps mapId）→ squadcalc slug
MAP_SLUGS = {
    "AlBasrah": "albasrah", "Anvil": "anvil", "BlackCoast": "blackcoast",
    "Chora": "chora", "Fallujah": "fallujah", "FoolsRoad": "foolsroad",
    "GooseBay": "goosebay", "Gorodok": "gorodok", "Harju": "harju",
    "Kamdesh": "kamdesh", "Kohat": "kohat", "Kokan": "kokan",
    "Lashkar": "lashkar", "Logar": "logar", "Manicouagan": "manicouagan",
    "Mestia": "mestia", "Mutaha": "mutaha", "Narva": "narva",
    "Sanxian_Islands": "sanxian", "Skorpo": "skorpo", "Sumari": "sumari",
    "Tallil": "tallil", "Yehorivka": "yehorivka",
}


def main():
    src_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/heightmaps")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    meta = {}
    for key, slug in MAP_SLUGS.items():
        src = src_dir / f"{slug}.json"
        if not src.exists():
            print(f"⚠️ 缺少 {src}，跳过 {key}")
            continue
        data = json.loads(src.read_text())
        rows = len(data)
        cols = len(data[0])
        vals = []
        lo, hi = 1e9, -1e9
        for row in data:
            for v in row:
                q = int(round(float(v) * 10))
                q = max(-32768, min(32767, q))
                vals.append(q)
                if v < lo:
                    lo = v
                if v > hi:
                    hi = v
        out = OUT_DIR / f"{slug}.bin"
        with open(out, "wb") as f:
            f.write(struct.pack("<" + "h" * len(vals), *vals))
        meta[key] = {
            "slug": slug,
            "rows": rows,
            "cols": cols,
            "scale": 10,
            "min": round(lo, 1),
            "max": round(hi, 1),
        }
        print(f"✅ {key:16s} {slug:12s} {rows}×{cols}  {out.stat().st_size/1024:.0f} KB  {lo:.1f}~{hi:.1f}m")

    js = (
        "/**\n"
        " * 高程数据索引（自动生成 · 请勿手改）\n"
        " * 生成脚本：scripts/build-heightmaps.py\n"
        " * 数据来源：squadcalc.app（500×500，米，量化 0.1m int16）\n"
        " */\n\n"
        "export const HEIGHTMAPS = " + json.dumps(meta, ensure_ascii=False, indent=2) + "\n\n"
        "export default HEIGHTMAPS\n"
    )
    META.write_text(js)
    print(f"\n✅ 写出 {META}（{len(meta)} 张）")
    print(f"   总量 {sum((OUT_DIR / (m['slug'] + '.bin')).stat().st_size for m in meta.values())/1024/1024:.1f} MB")


if __name__ == "__main__":
    main()

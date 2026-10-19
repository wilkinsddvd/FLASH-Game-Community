#!/usr/bin/env python3
"""
等高线图构建：高程 JSON → SVG（viewBox 0 0 1000 1000）

用法：python3 scripts/build-contours.py /tmp/heightmaps
输出：
  frontend/public/squad-assets/contours/<slug>.svg
  frontend/src/data/squad/contours-meta.js
"""
import json
import math
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / "frontend" / "public" / "squad-assets" / "contours"
META = REPO / "frontend" / "src" / "data" / "squad" / "contours-meta.js"

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


def choose_interval(lo, hi):
    rng = hi - lo
    if rng < 10:
        return 1
    if rng < 50:
        return 5
    if rng < 200:
        return 10
    if rng < 500:
        return 20
    return 50


def interp(v1, v2, level):
    if abs(v2 - v1) < 1e-9:
        return 0.5
    return (level - v1) / (v2 - v1)


def contour_segments(data, level):
    rows, cols = len(data), len(data[0])
    segs = []
    for r in range(rows - 1):
        row0, row1 = data[r], data[r + 1]
        for c in range(cols - 1):
            v00, v10 = row0[c], row0[c + 1]
            v01, v11 = row1[c], row1[c + 1]
            pts = []
            # top
            if (v00 < level <= v10) or (v10 < level <= v00):
                pts.append((c + interp(v00, v10, level), r, 't'))
            # right
            if (v10 < level <= v11) or (v11 < level <= v10):
                pts.append((c + 1, r + interp(v10, v11, level), 'r'))
            # bottom
            if (v01 < level <= v11) or (v11 < level <= v01):
                pts.append((c + interp(v01, v11, level), r + 1, 'b'))
            # left
            if (v00 < level <= v01) or (v01 < level <= v00):
                pts.append((c, r + interp(v00, v01, level), 'l'))
            if len(pts) == 2:
                segs.append((pts[0][:2], pts[1][:2]))
            elif len(pts) == 4:
                # saddle：按中心值分成两条
                center = (v00 + v10 + v01 + v11) / 4
                d = {p[2]: p[:2] for p in pts}
                if center >= level:
                    segs.append((d['t'], d['r']))
                    segs.append((d['b'], d['l']))
                else:
                    segs.append((d['t'], d['l']))
                    segs.append((d['b'], d['r']))
    return segs


def key(pt, scale=1000):
    return (round(pt[0] * scale), round(pt[1] * scale))


def build_paths(segs, rows, cols, epsilon=0.8):
    """把零散线段接成折线，并做 Douglas-Peucker 简化。"""
    # 先缩放成 viewBox 坐标
    sx = 1000.0 / (cols - 1)
    sy = 1000.0 / (rows - 1)
    scaled = [((a[0] * sx, a[1] * sy), (b[0] * sx, b[1] * sy)) for a, b in segs]

    adj = {}
    for i, (a, b) in enumerate(scaled):
        adj.setdefault(key(a), []).append((i, b))
        adj.setdefault(key(b), []).append((i, a))

    used = [False] * len(scaled)
    paths = []
    for i, (a, b) in enumerate(scaled):
        if used[i]:
            continue
        used[i] = True
        line = [a, b]
        # 向前
        cur_key, cur_pt = key(b), b
        while True:
            nxt = None
            for j, other in adj.get(cur_key, []):
                if not used[j]:
                    nxt = (j, other)
                    break
            if not nxt:
                break
            j, other = nxt
            used[j] = True
            line.append(other)
            cur_key, cur_pt = key(other), other
        # 向后
        cur_key = key(a)
        while True:
            nxt = None
            for j, other in adj.get(cur_key, []):
                if not used[j]:
                    nxt = (j, other)
                    break
            if not nxt:
                break
            j, other = nxt
            used[j] = True
            line.insert(0, other)
            cur_key = key(other)
        if len(line) >= 2:
            paths.append(line)
    return paths


def rdp(points, eps):
    if len(points) < 3:
        return points
    (x1, y1), (x2, y2) = points[0], points[-1]
    dx, dy = x2 - x1, y2 - y1
    den = math.hypot(dx, dy)
    best_i, best_d = 0, -1
    for i in range(1, len(points) - 1):
        px, py = points[i]
        if den == 0:
            d = math.hypot(px - x1, py - y1)
        else:
            d = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / den
        if d > best_d:
            best_i, best_d = i, d
    if best_d > eps:
        left = rdp(points[:best_i + 1], eps)
        right = rdp(points[best_i:], eps)
        return left[:-1] + right
    return [points[0], points[-1]]


def path_d(points):
    return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in points)


def build_map(key, slug, data):
    rows, cols = len(data), len(data[0])
    flat = [v for row in data for v in row]
    lo, hi = min(flat), max(flat)
    interval = choose_interval(lo, hi)
    start = math.ceil(lo / interval) * interval
    levels = list(range(start, int(hi) + 1, interval))
    minor, major = [], []
    for level in levels:
        segs = contour_segments(data, level)
        if not segs:
            continue
        paths = build_paths(segs, rows, cols)
        is_major = (level % (interval * 5) == 0)
        for line in paths:
            line = rdp(line, 0.8)
            if len(line) < 2:
                continue
            d = path_d(line)
            (major if is_major else minor).append((level, d))
    svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">',
        '<g stroke="#111" stroke-opacity=".45" stroke-width=".7">',
    ]
    for level, d in minor:
        svg.append(f'<path d="{d}"/>')
    svg.append('</g><g stroke="#111" stroke-opacity=".72" stroke-width="1.25">')
    labels = []
    for level, d in major:
        svg.append(f'<path d="{d}"/>')
        # 取路径第一个点标注
        try:
            first = d[1:].split(" L")[0].split(",")
            labels.append((float(first[0]), float(first[1]), level))
        except Exception:
            pass
    svg.append('</g>')
    if labels:
        svg.append('<g font-size="10" font-family="sans-serif" fill="#111" fill-opacity=".8">')
        for x, y, level in labels[:80]:
            svg.append(f'<text x="{x + 2:.0f}" y="{y - 2:.0f}">{level}</text>')
        svg.append('</g>')
    svg.append('</svg>')
    return "\n".join(svg), {
        "slug": slug,
        "interval": interval,
        "min": round(lo, 1),
        "max": round(hi, 1),
        "levels": len(levels),
        "majorLevels": len(major),
    }


def main():
    src_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/heightmaps")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    meta = {}
    for key, slug in MAP_SLUGS.items():
        src = src_dir / f"{slug}.json"
        if not src.exists():
            print(f"⚠️ 缺少 {src}，跳过")
            continue
        data = json.loads(src.read_text())
        svg, info = build_map(key, slug, data)
        out = OUT_DIR / f"{slug}.svg"
        out.write_text(svg)
        info["sizeKb"] = round(out.stat().st_size / 1024, 1)
        meta[key] = info
        print(f"✅ {key:16s} {slug:12s} 等高距 {info['interval']}m  {info['sizeKb']} KB  {info['min']}~{info['max']}m")

    js = (
        "/**\n"
        " * 等高线索引（自动生成 · 请勿手改）\n"
        " * 生成脚本：scripts/build-contours.py\n"
        " */\n\n"
        "export const CONTOURS = " + json.dumps(meta, ensure_ascii=False, indent=2) + "\n\n"
        "export default CONTOURS\n"
    )
    META.write_text(js)
    print(f"\n✅ 写出 {META}（{len(meta)} 张）")


if __name__ == "__main__":
    main()

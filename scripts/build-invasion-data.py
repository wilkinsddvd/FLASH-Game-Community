#!/usr/bin/env python3
"""
Invasion 点位数据构建脚本 —— 生成前端静态数据层（进攻方路线）

数据来源：squadmaps-v2 (MIT) data/v10_data.json
用法：python3 scripts/build-invasion-data.py /tmp/raas-raw/v10_data.json
产出：frontend/src/data/squad/invasion-data.js

结构：
  INVASION_MAPS = [{key,name,slug,size,layers:[raw,...]}]
  INVASION_LAYERS = {
    raw: {raw,name,map,ver,community,size,corners,teams,lanes,laneLinks,nodes}
  }
与 RAAS 的 lanes/laneLinks/nodes 完全兼容，可直接复用 buildRoutes。
"""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "frontend" / "src" / "data" / "squad" / "invasion-data.js"

SLUGS = {
    "AlBasrah": "albasrah", "Anvil": "anvil", "BlackCoast": "blackcoast",
    "Chora": "chora", "Fallujah": "fallujah", "FoolsRoad": "foolsroad",
    "GooseBay": "goosebay", "Gorodok": "gorodok", "Harju": "harju",
    "Kamdesh": "kamdesh", "Kohat": "kohat", "Kokan": "kokan",
    "Lashkar": "lashkar", "Logar": "logar", "Manicouagan": "manicouagan",
    "Mestia": "mestia", "Mutaha": "mutaha", "Narva": "narva",
    "Sanxian_Islands": "sanxian", "Skorpo": "skorpo", "Sumari": "sumari",
    "Tallil": "tallil", "Yehorivka": "yehorivka",
}


def num(v, default=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def zone_radius(point):
    best = 0.0
    for obj in point.get("objects") or []:
        if obj.get("isSphere"):
            best = max(best, num(obj.get("sphereRadius")))
        if obj.get("isBox"):
            ext = obj.get("boxExtent") or {}
            best = max(best, num(ext.get("extent_x")) / 2, num(ext.get("extent_y")) / 2)
        if obj.get("isCapsule"):
            best = max(best, 5000.0)
    return best if best > 0 else 6000.0


def build_nodes(objectives):
    nodes = {}
    for name, obj in (objectives or {}).items():
        pts = []
        for p in obj.get("points") or []:
            pts.append({
                "id": p.get("objectName"),
                "n": p.get("objectDisplayName") or p.get("name"),
                "x": round(num(p.get("location_x")), 1),
                "y": round(num(p.get("location_y")), 1),
                "r": round(zone_radius(p), 1),
            })
        if pts:
            avg = obj.get("avgLocation") or {}
            nodes[name] = {
                "x": round(num(avg.get("location_x", obj.get("location_x"))), 1),
                "y": round(num(avg.get("location_y", obj.get("location_y"))), 1),
                "pts": pts,
            }
        else:
            nodes[name] = {
                "main": True,
                "x": round(num(obj.get("location_x")), 1),
                "y": round(num(obj.get("location_y")), 1),
                "pts": [],
            }
    return nodes


def split_lanes(order):
    """pointsOrder: [main, A1..A5, main, B1..B5, ..., end] → 每条进攻链"""
    if not order:
        return []
    main, end = order[0], order[-1]
    lanes = []
    cur = []
    for n in order[1:]:
        if n in (main, end):
            if cur:
                lanes.append(cur)
                cur = []
        else:
            cur.append(n)
    if cur:
        lanes.append(cur)
    return main, end, lanes


def build_layer(layer):
    cp = layer.get("capturePoints") or {}
    clusters = cp.get("clusters") or {}
    order = clusters.get("pointsOrder") or []
    main, end, lane_points = split_lanes(order)
    if not main or not lane_points:
        return None

    nodes = build_nodes(layer.get("objectives"))
    node_keys = {str(k).replace(" ", "").lower() for k in nodes}
    for k, v in nodes.items():
        if v.get("pts"):
            for p in v["pts"]:
                node_keys.add(str(p.get("n") or "").replace(" ", "").lower())

    lane_links = {}
    lane_names = []
    for idx, pts in enumerate(lane_points):
        # lane 名优先用第一个点的字母前缀（A1 → A）
        first = str(pts[0])
        letter = first[0].upper() if first and first[0].isalpha() else chr(65 + idx)
        if letter in lane_links:
            letter = chr(65 + idx)
        lane_names.append(letter)
        chain = [main] + pts + [end]
        lane_links[letter] = [[a, b] for a, b in zip(chain, chain[1:])]

    corners = [[round(num(c.get("location_x")), 1), round(num(c.get("location_y")), 1)]
               for c in (layer.get("mapTextureCorners") or [])[:2]]

    # 少数图层 links 里的节点名与 objectives 对不上（如 01-CaptureZoneCluster vs A1-…）
    # 这类图层无法可靠定位，直接跳过，避免页面出现 0 个进攻点。
    unresolved = []
    for links in lane_links.values():
        for a, b in links:
            for n in (a, b):
                if str(n).replace(" ", "").lower() not in node_keys:
                    unresolved.append(n)
    if unresolved:
        return None

    tc = layer.get("teamConfigs") or {}
    teams = []
    for slot in ("team1", "team2"):
        cfg = tc.get(slot) or {}
        unit = cfg.get("defaultFaction") or cfg.get("defaultFactionUnit")
        if unit:
            teams.append(unit)

    raw = layer["rawName"]
    return raw, {
        "raw": raw,
        "mode": "Invasion",
        "name": layer.get("Name") or raw,
        "map": layer.get("mapId"),
        "ver": (layer.get("layerVersion") or "").replace("_", " ").strip(),
        "community": raw.endswith("_CL"),
        "size": layer.get("mapSize"),
        "corners": corners,
        "lanes": lane_names,
        "laneLinks": lane_links,
        "nodes": nodes,
        "teams": teams,
    }


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "/tmp/raas-raw/v10_data.json"
    raw = json.loads(Path(src).read_text())
    layers = raw["W"] if isinstance(raw, dict) else raw

    selected = [L for L in layers if L.get("gamemode") == "Invasion"
                and not str(L.get("rawName", "")).endswith("_WP")]

    out_layers = {}
    maps = {}
    skipped = []
    for L in selected:
        built = build_layer(L)
        if not built:
            skipped.append(L.get("rawName"))
            continue
        raw_name, lay = built
        out_layers[raw_name] = lay
        m = lay["map"]
        maps.setdefault(m, {
            "key": m,
            "name": L.get("mapName") or m,
            "slug": SLUGS.get(m, m.lower()),
            "size": L.get("mapSize"),
            "layers": [],
        })
        maps[m]["layers"].append(raw_name)

    def sort_key(r):
        ver = out_layers[r]["ver"]
        digits = "".join(ch for ch in ver if ch.isdigit()) or "0"
        return (int(digits), out_layers[r]["community"], r)

    for m in maps.values():
        m["layers"].sort(key=sort_key)
        m["layerCount"] = len(m["layers"])

    payload = {
        "generatedAt": __import__("datetime").date.today().isoformat(),
        "source": "squadmaps-v2 (MIT) data/v10_data.json",
        "mode": "Invasion",
        "maps": sorted(maps.values(), key=lambda x: x["name"]),
        "layers": out_layers,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    js = (
        "/**\n"
        " * 《战术小队》Invasion 点位数据（自动生成 · 请勿手改）\n"
        " * 生成脚本：scripts/build-invasion-data.py\n"
        " * 数据来源：squadmaps-v2 (MIT) https://github.com/aachtenberg/squadmaps-v2\n"
        f" * 生成日期：{payload['generatedAt']}\n"
        f" * 内容：{len(payload['maps'])} 张地图 / {len(out_layers)} 个 Invasion 图层\n"
        " */\n\n"
        "export const INVASION_META = " + json.dumps(
            {k: v for k, v in payload.items() if k != "layers"},
            ensure_ascii=False, separators=(",", ":")) + "\n\n"
        "export const INVASION_LAYERS = " + json.dumps(
            payload["layers"], ensure_ascii=False, separators=(",", ":")) + "\n\n"
        "export const INVASION_MAPS = INVASION_META.maps\n\n"
        "export default { INVASION_META, INVASION_MAPS, INVASION_LAYERS }\n"
    )
    OUT.write_text(js)
    print(f"✅ 写出 {OUT}")
    print(f"   地图 {len(payload['maps'])} 张 / 图层 {len(out_layers)} 个 / {OUT.stat().st_size/1024:.0f} KB")
    if skipped:
        print(f"   ⚠️ 跳过 {len(skipped)} 个点位名对不上的图层：{', '.join(skipped)}")
    for m in payload["maps"]:
        print(f"     {m['name']:24s} {len(m['layers'])}  {m['layers']}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
RAAS 数据构建脚本 —— 生成前端静态数据层

数据来源：
  squadmaps-v2 (MIT)  data/v10_data.json
  https://github.com/aachtenberg/squadmaps-v2

用法：
  1) 抓取原始数据（约 22MB，国内需走代理）：
     curl -x http://127.0.0.1:7890 -o /tmp/raas-raw/v10_data.json \
       https://raw.githubusercontent.com/aachtenberg/squadmaps-v2/main/data/v10_data.json
  2) python3 scripts/build-raas-data.py /tmp/raas-raw/v10_data.json

产出：
  frontend/src/data/squad/raas-data.js     （地图清单 + 图层数据）
"""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "frontend" / "src" / "data" / "squad" / "raas-data.js"

# 地图 key -> squadmaps 静态资源 slug（底图 frontend/public/squad-assets/raas/maps/<slug>.webp）
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

# 变体图层后缀（与标准版仅候选点顺序不同，无独立价值）：直接跳过
SKIP_SUFFIX = ("_WP",)


def num(v, default=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def zone_radius(point):
    """从占领区几何里取一个代表性半径（cm），用于画圈。"""
    best = 0.0
    for obj in point.get("objects") or []:
        if obj.get("isSphere"):
            best = max(best, num(obj.get("sphereRadius")))
        if obj.get("isBox"):
            ext = obj.get("boxExtent") or {}
            best = max(best, num(ext.get("extent_x")) / 2, num(ext.get("extent_y")) / 2)
        if obj.get("isCapsule"):
            best = max(best, 5000.0)
    # 几何缺失时给个合理的保底值（多数占点半径 50~150m）
    return best if best > 0 else 6000.0


def build_layer(L):
    cp = L.get("capturePoints") or {}
    objectives = L.get("objectives") or {}

    lanes_obj = cp.get("lanes") or {}
    clusters_obj = cp.get("clusters") or {}

    lane_links = {}   # { laneName: [[a,b], ...] }
    lane_names = []

    # 形式 A：多条命名 lane（lanes.laneObjects / lanes.links + listOfLanes）
    if lanes_obj.get("laneObjects"):
        for lname, lo in lanes_obj["laneObjects"].items():
            lane_names.append(lname)
            lane_links[lname] = [[k["nodeA"], k["nodeB"]] for k in (lo.get("laneLinks") or [])]
    elif lanes_obj.get("links"):
        lane_names = list(lanes_obj.get("listOfLanes") or [])
        lane_links["_"] = [[k["nodeA"], k["nodeB"]] for k in lanes_obj["links"]]

    # 形式 B：单链（clusters.links）
    if not lane_links and clusters_obj.get("links"):
        lane_links["_"] = [[k["nodeA"], k["nodeB"]] for k in clusters_obj["links"]]

    # 节点表：cluster（含候选点）与 main（无候选点）
    nodes = {}
    for nname, o in objectives.items():
        pts = []
        for p in o.get("points") or []:
            pts.append({
                "id": p.get("objectName"),
                "n": p.get("objectDisplayName") or p.get("name"),
                "x": round(num(p.get("location_x")), 1),
                "y": round(num(p.get("location_y")), 1),
                "r": round(zone_radius(p), 1),
            })
        if pts:
            avg = o.get("avgLocation") or {}
            nodes[nname] = {
                "x": round(num(avg.get("location_x", o.get("location_x"))), 1),
                "y": round(num(avg.get("location_y", o.get("location_y"))), 1),
                "pts": pts,
            }
        else:
            nodes[nname] = {
                "main": True,
                "x": round(num(o.get("location_x")), 1),
                "y": round(num(o.get("location_y")), 1),
                "pts": [],
            }

    corners = [[round(num(c.get("location_x")), 1), round(num(c.get("location_y")), 1)]
               for c in (L.get("mapTextureCorners") or [])[:2]]

    # teams = [team1, team2] 的默认阵营/兵种，用于页面区分两个出生点。
    # ⚠️ v10_data.json 里只有 defaultFactionUnit（如 USMC_LO_CombinedArms），
    #    没有 defaultFaction，所以两个都取，取到哪个用哪个。
    tc = L.get("teamConfigs") or {}
    teams = []
    for slot in ("team1", "team2"):
        cfg = tc.get(slot) or {}
        unit = cfg.get("defaultFaction") or cfg.get("defaultFactionUnit")
        if unit:
            teams.append(unit)

    raw = L["rawName"]
    return {
        "raw": raw,
        "name": L.get("Name") or raw,
        "map": L.get("mapId"),
        "ver": (L.get("layerVersion") or "").replace("_", " ").strip(),
        "community": raw.endswith("_CL"),
        "size": L.get("mapSize"),
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

    raas = [L for L in layers
            if L.get("gamemode") == "RAAS"
            and not str(L.get("rawName", "")).endswith(SKIP_SUFFIX)]

    out_layers = {}
    maps = {}
    for L in raas:
        lay = build_layer(L)
        out_layers[lay["raw"]] = lay
        m = lay["map"]
        maps.setdefault(m, {
            "key": m,
            "name": L.get("mapName") or m,
            "slug": SLUGS.get(m, m.lower()),
            "size": L.get("mapSize"),
            "layers": [],
        })
        maps[m]["layers"].append(lay["raw"])

    # 图层排序：v1, v2, v3, ...（CL 排最后）
    def sort_key(r):
        ver = out_layers[r]["ver"]
        digits = "".join(ch for ch in ver if ch.isdigit()) or "0"
        return (int(digits), out_layers[r]["community"], r)

    for m in maps.values():
        m["layers"].sort(key=sort_key)
        m["raasCount"] = len(m["layers"])

    payload = {
        "generatedAt": __import__("datetime").date.today().isoformat(),
        "source": "squadmaps-v2 (MIT) data/v10_data.json",
        "maps": sorted(maps.values(), key=lambda x: x["name"]),
        "layers": out_layers,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    js = (
        "/**\n"
        " * 《战术小队》RAAS 点位数据（自动生成 · 请勿手改）\n"
        " * 生成脚本：scripts/build-raas-data.py\n"
        " * 数据来源：squadmaps-v2 (MIT) https://github.com/aachtenberg/squadmaps-v2\n"
        f" * 生成日期：{payload['generatedAt']}\n"
        f" * 内容：{len(payload['maps'])} 张地图 / {len(out_layers)} 个 RAAS 图层\n"
        " */\n\n"
        "export const RAAS_META = " + json.dumps(
            {k: v for k, v in payload.items() if k != "layers"},
            ensure_ascii=False, separators=(",", ":")) + "\n\n"
        "export const RAAS_LAYERS = " + json.dumps(
            payload["layers"], ensure_ascii=False, separators=(",", ":")) + "\n\n"
        "export const RAAS_MAPS = RAAS_META.maps\n\n"
        "export default { RAAS_META, RAAS_MAPS, RAAS_LAYERS }\n"
    )
    OUT.write_text(js)
    print(f"✅ 写出 {OUT}")
    print(f"   地图 {len(payload['maps'])} 张 / 图层 {len(out_layers)} 个 / {OUT.stat().st_size/1024:.0f} KB")
    print("   每图图层数：")
    for m in payload["maps"]:
        print(f"     {m['name']:24s} {len(m['layers'])}  {m['layers']}")


if __name__ == "__main__":
    main()

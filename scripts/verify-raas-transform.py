#!/usr/bin/env python3
"""坐标变换视觉校验：把图层点位画到地图底图上，人工核对位置是否正确。"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

RAW = Path("/tmp/raas-raw")
IMG = Path("/Users/linhao_wang/code/FLASH/frontend/public/squad-assets/raas/maps")
SLUGS = {"Mutaha": "mutaha", "Anvil": "anvil", "AlBasrah": "albasrah", "Narva": "narva",
         "Sanxian_Islands": "sanxian", "Harju": "harju", "Yehorivka": "yehorivka"}


def main(layer_name):
    data = json.loads((RAW / "v10_data.json").read_text())
    layers = {L["rawName"]: L for L in data["W"]}
    L = layers[layer_name]
    slug = SLUGS.get(L["mapId"], L["mapId"].lower())
    img_path = IMG / f"{slug}.webp"
    im = Image.open(img_path).convert("RGB")
    W, H = im.size

    c = L["mapTextureCorners"]
    minX, maxX = min(c[0]["location_x"], c[1]["location_x"]), max(c[0]["location_x"], c[1]["location_x"])
    minY, maxY = min(c[0]["location_y"], c[1]["location_y"]), max(c[0]["location_y"], c[1]["location_y"])

    d = ImageDraw.Draw(im, "RGBA")
    colors = {"Main": (0, 255, 0, 255), "cluster": (255, 60, 60, 255), "point": (255, 220, 0, 255)}
    n = 0
    for name, o in L["objectives"].items():
        pts = o.get("points") or []
        if not pts:
            x, y = o.get("location_x"), o.get("location_y")
            px = (x - minX) / (maxX - minX) * W
            py = (y - minY) / (maxY - minY) * H
            d.ellipse([px - 10, py - 10, px + 10, py + 10], outline=colors["Main"], width=5)
            d.text((px + 12, py - 6), f"MAIN {name[:14]}", fill=(0, 255, 0, 255))
            n += 1
        else:
            for p in pts:
                x, y = p["location_x"], p["location_y"]
                px = (x - minX) / (maxX - minX) * W
                py = (y - minY) / (maxY - minY) * H
                d.ellipse([px - 7, py - 7, px + 7, py + 7], fill=colors["point"])
                d.text((px + 9, py - 14), p["objectDisplayName"][:22], fill=(255, 255, 255, 255))
                n += 1
    out = Path(f"/tmp/verify_{layer_name}.png")
    im.save(out)
    print(f"✅ {out}  ({W}x{H}, {n} 个标记)")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "Mutaha_RAAS_v1")

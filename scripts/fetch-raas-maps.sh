#!/usr/bin/env bash
# RAAS 地图底图下载 + 压缩
#   原图 4096x4096 存 /tmp/raas-raw/maps/（不入库）
#   站点用 2048px 详情图 + 512px 缩略图，输出到 frontend/public/squad-assets/raas/
set -u
SLUGS="albasrah anvil blackcoast chora fallujah foolsroad goosebay gorodok harju kamdesh kohat kokan lashkar logar manicouagan mestia mutaha narva sanxian skorpo sumari tallil yehorivka"
RAW=/tmp/raas-raw/maps
PROJ=/Users/linhao_wang/code/FLASH/frontend/public/squad-assets/raas
PROXY=http://127.0.0.1:7890
mkdir -p "$RAW" "$PROJ/maps" "$PROJ/thumbs"

ok=0; skip=0; fail=""
for s in $SLUGS; do
  src="$RAW/$s.webp"
  if [ ! -s "$src" ]; then
    got=0
    for attempt in 1 2 3; do
      code=$(curl -s -m 120 -x "$PROXY" -o "$src.part" -w "%{http_code}" "https://squadmaps.com/assets/maps/$s/basemap.webp")
      sz=$(stat -f%z "$src.part" 2>/dev/null || echo 0)
      if [ "$code" = "200" ] && [ "$sz" -gt 100000 ]; then mv "$src.part" "$src"; got=1; break; fi
      rm -f "$src.part"; sleep 3
    done
    if [ "$got" != "1" ]; then fail="$fail $s"; echo "❌ 下载失败 $s (HTTP $code)"; continue; fi
  else
    skip=$((skip+1))
  fi

  cwebp -quiet -resize 2048 2048 -q 80 "$src" -o "$PROJ/maps/$s.webp" 2>/dev/null
  cwebp -quiet -resize 512 512 -q 75 "$src" -o "$PROJ/thumbs/$s.webp" 2>/dev/null
  d=$(stat -f%z "$PROJ/maps/$s.webp" 2>/dev/null || echo 0)
  t=$(stat -f%z "$PROJ/thumbs/$s.webp" 2>/dev/null || echo 0)
  if [ "$d" -gt 10000 ]; then
    ok=$((ok+1)); printf "✅ %-14s 详情 %6dKB  缩略 %4dKB\n" "$s" $((d/1024)) $((t/1024))
  else
    fail="$fail $s"; printf "❌ %-14s 压缩失败\n" "$s"
  fi
done
echo "-----"
echo "成功 $ok / 23（已缓存 $skip）"
[ -n "$fail" ] && echo "失败:$fail"
du -sh "$PROJ"

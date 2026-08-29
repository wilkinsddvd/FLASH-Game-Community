#!/usr/bin/env python3
"""从 Wikimedia Commons 搜索并下载车辆参考图（缩略图 600px），供 phash 对比验证本地图片"""
import urllib.request, urllib.parse, json, os, sys, time

UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) FLASH/1.0'}
OUT = os.path.join(os.path.dirname(__file__), 'ref_imgs')
os.makedirs(OUT, exist_ok=True)

def api(params):
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())

def search_files(query, limit=6):
    """搜索 File 命名空间图片，返回 [(title, thumburl, w, h, mime)]"""
    d = api({'action': 'query', 'format': 'json', 'generator': 'search',
             'gsrsearch': f'filetype:bitmap {query}', 'gsrnamespace': '6',
             'gsrlimit': str(limit), 'prop': 'imageinfo',
             'iiprop': 'url|size|mime', 'iiurlwidth': '600'})
    out = []
    for p in d.get('query', {}).get('pages', {}).values():
        ii = p.get('imageinfo', [{}])[0]
        if ii and ii.get('thumburl'):
            out.append((p.get('title', ''), ii['thumburl'], ii.get('width'), ii.get('height'), ii.get('mime')))
    return out

def download(url, dest):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    with open(dest, 'wb') as f:
        f.write(data)
    return dest

if __name__ == '__main__':
    # 用法: python3 commons_fetch.py "M113A3" outname.png
    query = sys.argv[1]
    outname = sys.argv[2] if len(sys.argv) > 2 else query.replace(' ', '_') + '.img'
    res = search_files(query)
    print(f"=== {query}: {len(res)} results ===")
    for t, u, w, h, m in res[:5]:
        print(f"  {w}x{h} {m} {t}")
    if res:
        t, u, w, h, m = res[0]
        dest = os.path.join(OUT, outname)
        download(u, dest)
        print(f"downloaded -> {dest}")

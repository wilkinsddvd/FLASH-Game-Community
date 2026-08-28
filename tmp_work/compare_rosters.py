#!/usr/bin/env python3
"""按文档目录类型精确对比 SQUAD编制 md 与前端 factions.js 载具数据"""
import re, os

DOC_ROOT = "/Users/linhao_wang/Desktop/dev/SQUAD编制"
JS_PATH = "/Users/linhao_wang/Desktop/dev/FLASH/frontend/src/data/squad/factions.js"

DIR_TYPE = {
    "合成化": "combined", "摩托化": "motorized", "支援营": "support",
    "机械化": "mechanized", "空突": "airassault", "装甲旅": "armored",
    "轻步兵": "light_infantry",
}

with open(JS_PATH, encoding='utf-8') as f:
    src = f.read()

front = {}
for fm in re.finditer(r"code: '(\w+)'", src):
    code = fm.group(1)
    seg_start = fm.start()
    next_m = re.search(r"code: '", src[fm.end():])
    seg_end = fm.end() + next_m.start() if next_m else len(src)
    seg = src[seg_start:seg_end]
    for rm in re.finditer(r"(?<!type_)key: '([^']+)'", seg):
        rs = rm.start()
        rn = re.search(r"(?<!type_)key: '", seg[rs + 10:])
        re_ = rs + 10 + rn.start() if rn else len(seg)
        rseg = seg[rs:re_]
        name = re.search(r"name: '([^']+)'", rseg)
        tkey = re.search(r"type_key: '(\w+)'", rseg)
        vm = re.search(r"vehicles: \[(.*?)\n\s*\],", rseg, re.S)
        vehs = re.findall(r"\{\s*name: '([^']+)'[^}]*?count: (\d+)", vm.group(1), re.S) if vm else []
        front[(code, tkey.group(1) if tkey else '?')] = (name.group(1) if name else '?', vehs)


def parse_md(path):
    with open(path, encoding='utf-8') as f:
        text = f.read()
    m = re.search(r"编制名称[:：]\s*(.+)$", text, re.M)
    title = m.group(1).strip() if m else os.path.basename(path).replace('.md', '')
    rows = []
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith('|'):
            continue
        cells = [c.strip() for c in line.strip('|').split('|')]
        if len(cells) >= 2 and cells[0] and cells[0] != '名称':
            try:
                rows.append((cells[0], int(cells[1])))
            except ValueError:
                pass
    return title, rows


def norm(s):
    return re.sub(r'[\s\-‐‑−–—]+', '', s).lower().replace('‑', '')


issues = []
checked = 0
for root, dirs, files in os.walk(DOC_ROOT):
    dirname = os.path.basename(root)
    if dirname not in DIR_TYPE:
        continue
    tkey = DIR_TYPE[dirname]
    for fn in sorted(files):
        if not fn.endswith('.md'):
            continue
        doc_title, doc_rows = parse_md(os.path.join(root, fn))
        code = fn.split(' ')[0]
        key = (code, tkey)
        if key not in front:
            issues.append(f"[{dirname}/{fn}] 前端无 {key}")
            continue
        fname, fvehs = front[key]
        checked += 1
        doc_map = {}
        for n, c in doc_rows:
            doc_map.setdefault(norm(n), []).append(c)
        js_map = {}
        for n, c in fvehs:
            js_map.setdefault(norm(n), []).append(int(c))
        for dn, dc in doc_map.items():
            if dn not in js_map:
                issues.append(f"[{code}/{tkey}] {fname}: 文档有 '{dn}' x{sum(dc)} 前端缺失")
            elif sum(dc) != sum(js_map[dn]):
                issues.append(f"[{code}/{tkey}] {fname}: '{dn}' 文档 x{sum(dc)} 前端 x{sum(js_map[dn])}")
        for jn, jc in js_map.items():
            if jn not in doc_map and jn != '无':
                issues.append(f"[{code}/{tkey}] {fname}: 前端多出 '{jn}' x{sum(jc)}")

print(f"共对比 {checked} 个编制")
if issues:
    print(f"发现 {len(issues)} 个差异：")
    for x in issues:
        print(" ", x)
else:
    print("✅ 全部一致")

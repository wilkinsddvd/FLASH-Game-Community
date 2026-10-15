#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
merge-roster-docs.py — 把 Squad 编制文档里的「阵营特色 / 前哨基地部署物」合并进前端静态数据。

用法:
    python3 scripts/merge-roster-docs.py
    python3 scripts/merge-roster-docs.py <DOC_ROOT> <TARGET_JS> [REPORT_MD]

默认:
    DOC_ROOT  = /Users/linhao_wang/beifen/dev/SQUAD编制   (仓库外，只读)
    TARGET_JS = <repo>/frontend/src/data/squad/factions.js
    REPORT_MD = /tmp/roster-merge-report.md

原理:
  · 文档按 (阵营code, 类型目录) 定位 roster —— 不按名字匹配（文档名与 App 里的
    roster.name 存在 一/1、连字符、空格 差异）。
  · 在 factions.js 每个 roster 的 `type_icon: ...` 行之后插入/替换 traits、deployables
    两个字段。字段名缩进 8 空格，数组项缩进 10 空格。
  · 幂等：字段已存在则整块替换；其余内容逐字节不变。

兼容三种混排格式:
  ① `## 阵营特色`     + `- 条目`
  ② `### 阵营特色`    + `‑ 条目`  (U+2011 非断连字符)
  ③ 纯文本 `阵营特色：` / `前哨基地部署物：` + `* 条目`
"""

import os
import re
import sys

# ────────────────────────── 常量 ──────────────────────────

DEFAULT_DOC_ROOT = "/Users/linhao_wang/beifen/dev/SQUAD编制"
_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_TARGET_JS = os.path.join(_REPO_ROOT, "frontend", "src", "data", "squad", "factions.js")
DEFAULT_REPORT_MD = "/tmp/roster-merge-report.md"

# 文档子目录 → App roster.type
DIR_TO_TYPE = {
    "合成化": "合成",
    "摩托化": "摩托化",
    "支援营": "支援",
    "机械化": "机械化",
    "空突": "空降",
    "装甲旅": "装甲",
    "轻步兵": "轻步兵",
}

# 条目 bullet 前缀: 普通减号 / U+2011 非断连字符 / 星号 / 圆点
BULLET_RE = re.compile(r"^[\-\u2011\*\u2022]\s*(.+)$")
# 视为「无特色」的占位条目
NULL_TRAIT = {"无特色", "无"}

# 脏行过滤（表格行 / 「表格」标记）
def _is_dirty(s):
    st = s.strip()
    return st == "表格" or (st.startswith("|") and st.endswith("|"))


# ────────────────────────── 解析 ──────────────────────────

_SEC_TRAITS_RE = re.compile(r"^(?:#{1,6}[ \t]*阵营特色|阵营特色[:：])[ \t]*$", re.M)
_SEC_DEPLOY_RE = re.compile(r"^(?:#{1,6}[ \t]*前哨基地部署物|前哨基地部署物[:：])[ \t]*$", re.M)
_NEXT_HEAD_RE = re.compile(r"^#{1,6}\s", re.M)


def _extract_bullets(text, section_re):
    """定位某个 section 标题，返回其正文里的 bullet 条目文本（原样，仅 trim + 去 bullet）。"""
    m = section_re.search(text)
    if not m:
        return None  # 压根没这一栏
    rest = text[m.end():]
    nxt = _NEXT_HEAD_RE.search(rest)
    seg = rest[:nxt.start()] if nxt else rest
    items = []
    for raw in seg.splitlines():
        s = raw.strip()
        if not s:
            continue
        if _is_dirty(s):
            continue
        bm = BULLET_RE.match(s)
        if not bm:
            continue  # 非 bullet 行（如 '>' 引用、纯文本说明）一律不收
        items.append(bm.group(1).strip())
    return items


def parse_doc(path):
    """解析单个 md → (traits:list, deployables:list, raw_trait_count:int, had_traits_section:bool)"""
    with open(path, encoding="utf-8") as f:
        text = f.read()

    raw_traits = _extract_bullets(text, _SEC_TRAITS_RE)
    raw_deploy = _extract_bullets(text, _SEC_DEPLOY_RE)

    had_traits_section = raw_traits is not None
    if raw_traits is None:
        raw_traits = []
    if raw_deploy is None:
        raw_deploy = []  # 理论上不会发生（要求 80/80）

    raw_trait_count = len(raw_traits)
    traits = [t for t in raw_traits if t not in NULL_TRAIT]
    if not traits:
        traits = []
    return traits, raw_deploy, raw_trait_count, had_traits_section


def collect_docs(doc_root):
    """遍历文档库 → {(code, type): {...}}"""
    records = {}
    for dirname in sorted(os.listdir(doc_root)):
        full = os.path.join(doc_root, dirname)
        if not os.path.isdir(full) or dirname not in DIR_TO_TYPE:
            continue
        rtype = DIR_TO_TYPE[dirname]
        for fn in sorted(os.listdir(full)):
            if not fn.endswith(".md"):
                continue
            m = re.match(r"^([A-Za-z]+)\s", fn)
            if not m:
                raise SystemExit(f"[ERR] 文件名无法解析阵营 code: {dirname}/{fn}")
            code = m.group(1).upper()
            traits, deploy, raw_cnt, had = parse_doc(os.path.join(full, fn))
            key = (code, rtype)
            if key in records:
                raise SystemExit(f"[ERR] (code,type) 重复: {key}")
            records[key] = {
                "code": code,
                "type": rtype,
                "dir": dirname,
                "file": fn,
                "traits": traits,
                "deployables": deploy,
                "raw_trait_count": raw_cnt,
                "had_traits_section": had,
            }
    return records


# ────────────────────────── factions.js 读写 ──────────────────────────

def js_escape(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")


def build_block(traits, deployables):
    """生成要插入的行列表（带换行）。"""
    lines = ["        traits: [\n"]
    for t in traits:
        lines.append(f"          '{js_escape(t)}',\n")
    lines.append("        ],\n")
    lines.append("        deployables: [\n")
    for d in deployables:
        lines.append(f"          '{js_escape(d)}',\n")
    lines.append("        ],\n")
    return lines


def _consume_field(lines, j, field):
    """若 lines[j] 是 `        <field>: [`，消费整个块，返回之后的下标。"""
    if j < len(lines) and lines[j] == f"        {field}: [\n":
        j += 1
        while j < len(lines) and not lines[j].startswith("        ]"):
            j += 1
        if j < len(lines):
            j += 1  # 消费 '        ],\n'
    return j


def merge_js(target_js, records):
    with open(target_js, encoding="utf-8") as f:
        original = f.read()

    lines = original.splitlines(keepends=True)
    out = []
    cur_code = None
    cur_type = None
    cur_name = None
    used = set()
    names = {}
    matched = 0

    i = 0
    while i < len(lines):
        line = lines[i]

        mc = re.match(r"^    code: '([^']+)',", line)
        if mc:
            cur_code = mc.group(1)
        mt = re.match(r"^        type: '([^']+)',", line)
        if mt:
            cur_type = mt.group(1)
        mn = re.match(r"^        name: '([^']+)',", line)
        if mn:
            cur_name = mn.group(1)

        if re.match(r"^        type_icon: ", line):
            key = (cur_code, cur_type)
            if key not in records:
                out.append(line)
                i += 1
                continue
            rec = records[key]
            used.add(key)
            matched += 1
            names[key] = cur_name
            out.append(line)
            # 幂等：消费已存在的 traits / deployables 块
            j = _consume_field(lines, i + 1, "traits")
            j = _consume_field(lines, j, "deployables")
            out.extend(build_block(rec["traits"], rec["deployables"]))
            i = j
            continue

        out.append(line)
        i += 1

    result = "".join(out)

    unmatched = [k for k in records if k not in used]
    return result, matched, unmatched, names


# ────────────────────────── 报告 ──────────────────────────

def write_report(report_path, records, unmatched, matched, names):
    order = [(c, t) for (c, t) in records]
    order.sort(key=lambda k: (k[0], k[1]))
    non_empty_traits = sum(1 for r in records.values() if r["traits"])
    total_deploy = sum(len(r["deployables"]) for r in records.values())
    total_raw_traits = sum(r["raw_trait_count"] for r in records.values())

    lines = []
    lines.append("# Squad 编制文档合并报告\n")
    lines.append(f"- 文档编制数: {len(records)}")
    lines.append(f"- factions.js 命中 roster: {matched}")
    lines.append(f"- 阵营特色 非空编制数: {non_empty_traits}")
    lines.append(f"- 阵营特色 原始条目总数: {total_raw_traits}")
    lines.append(f"- 前哨基地部署物 总条数: {total_deploy}")
    lines.append(f"- 前哨基地部署物 非空编制数: {sum(1 for r in records.values() if r['deployables'])}")
    lines.append(f"- 未匹配清单: {unmatched if unmatched else '（无）'}")
    lines.append("")
    lines.append("## 明细（阵营code | 类型 | 编制名 | 特色条数 | 部署物条数）\n")
    lines.append("| 阵营 | 类型 | 编制名 | 特色条数 | 部署物条数 |")
    lines.append("| --- | --- | --- | --- | --- |")
    for code, t in order:
        r = records[(code, t)]
        name = names.get((code, t), r["file"])
        lines.append(f"| {code} | {t} | {name} | {len(r['traits'])} | {len(r['deployables'])} |")
    lines.append("")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


# ────────────────────────── main ──────────────────────────

def main(argv):
    doc_root = argv[1] if len(argv) > 1 else DEFAULT_DOC_ROOT
    target_js = argv[2] if len(argv) > 2 else DEFAULT_TARGET_JS
    report_md = argv[3] if len(argv) > 3 else DEFAULT_REPORT_MD

    if not os.path.isdir(doc_root):
        raise SystemExit(f"[ERR] 文档根目录不存在: {doc_root}")
    if not os.path.isfile(target_js):
        raise SystemExit(f"[ERR] 目标文件不存在: {target_js}")

    records = collect_docs(doc_root)
    print(f"[info] 解析到文档编制: {len(records)}")

    result, matched, unmatched, names = merge_js(target_js, records)

    if unmatched:
        raise SystemExit(f"[ERR] 以下 (code,type) 在 factions.js 中未命中: {unmatched}")

    with open(target_js, "w", encoding="utf-8") as f:
        f.write(result)

    write_report(report_md, records, unmatched, matched, names)
    print(f"[info] 命中 roster: {matched} / {len(records)}")
    print(f"[info] 报告: {report_md}")
    print("[done]")


if __name__ == "__main__":
    main(sys.argv)

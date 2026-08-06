#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
macOS 微信消息监控 —— 纯 Python 读库方案
========================================
原理:
  微信 Mac 版 (4.x, xwechat_files 结构) 聊天记录存在本地 SQLCipher 加密的
  SQLite 库 (db_storage/message/message_*.db) 中。
  消息到达即落盘, 撤回只是改标记/隐藏, 数据仍在本地 -> 读库天然"防撤回"。

流程:
  1. 定位最新的 message_*.db
  2. 用 SQLCipher 密钥打开 (优先读 keys.json, 也支持 WECHAT_DB_KEY)
  3. 轮询新消息, 按 msg_id 去重, 追加写入 wechat_monitor.db

密钥获取:
  运行 sudo python3 extract_key.py 从微信进程内存提取密钥,
  自动保存为 keys.json (本脚本自动加载)。

依赖:
  pip install -r requirements.txt   # sqlcipher3 + pycryptodome

用法:
  python3 wx_monitor.py            # 持续轮询
  python3 wx_monitor.py --once     # 跑一次全量导入(用于测试/备份)
"""

import argparse
import base64
import glob
import json
import logging
import os
import sqlite3
import sys
import time
from datetime import datetime
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("wxmon")

# ---------------- 配置 ----------------
# 微信 4.x (xwechat_files 结构)
WECHAT_DB_GLOB = os.path.expanduser(
    "~/Library/Containers/com.tencent.xinWeChat/Data/Documents/"
    "xwechat_files/*/db_storage/message/message_*.db"
)
KEY = os.environ.get("WECHAT_DB_KEY", "").strip()  # 可选: 64 位 hex 密钥
KEYS_FILE = Path(__file__).resolve().parent / "keys.json"  # extract_key.py 输出
POLL_INTERVAL = float(os.environ.get("POLL_INTERVAL", "3"))  # 秒
OUT_DB = Path(__file__).resolve().parent / "wechat_monitor.db"

# ---------------- 消息表/列 适配 (各版本命名不同, 模糊匹配) ----------------
TABLE_CANDIDATES = ["Message", "ChatMessage", "MSG", "msg"]
ID_COLS      = ["mesSvrID", "mesLocalID", "msgId", "localId", "msgSvrId"]
TIME_COLS    = ["mesCreateTime", "createTime", "msgCreateTime", "mesLocalTime"]
CONTENT_COLS = ["mesContent", "content", "msgContent", "message"]
CHAT_COLS    = ["mesChatId", "chatId", "strTalker", "sessionId", "mesSessionId"]
SENDER_COLS  = ["mesDes", "sender", "isSender", "mesIsSender", "des", "fromUser"]


def pick_db():
    """找最新的 message_*.db (排除 fts/kvdb)"""
    dbs = [d for d in glob.glob(WECHAT_DB_GLOB)
           if not d.endswith(('-fts.db', '.kvdb'))]
    dbs = sorted(dbs, key=os.path.getmtime, reverse=True)
    if not dbs:
        raise FileNotFoundError(f"没找到微信数据库: {WECHAT_DB_GLOB}")
    return dbs[0]


def load_keys():
    """从 keys.json 加载密钥: {db路径: {enc_key, salt}}"""
    if KEYS_FILE.exists():
        try:
            return json.loads(KEYS_FILE.read_text())
        except Exception as e:
            log.warning("keys.json 解析失败: %s", e)
    return {}


def key_for_db(path, keys):
    """按数据库路径精确/模糊匹配密钥"""
    if path in keys:
        return keys[path].get("enc_key", "")
    for k, v in keys.items():
        if os.path.basename(k) == os.path.basename(path):
            return v.get("enc_key", "")
    return ""


def open_encrypted(path):
    """用 SQLCipher 密钥打开微信库 (SQLCipher4: AES-256-CBC + HMAC-SHA512)"""
    key = KEY or key_for_db(path, load_keys())
    if not key:
        raise RuntimeError(
            "没有可用密钥。先运行:  sudo python3 extract_key.py  (生成 keys.json)"
        )
    conn = sqlite3.connect(path)
    # raw key 方式: x'<hex>'
    conn.execute(f'PRAGMA key = "x\'{key}\'";')
    conn.execute("PRAGMA cipher_page_size = 4096;")
    conn.execute("PRAGMA cipher_hmac_algorithm = HMAC_SHA512;")
    conn.execute("PRAGMA cipher_kdf_algorithm = PBKDF2_HMAC_SHA512;")
    # 验证: 随便查一下, 密钥错会抛 DatabaseError
    conn.execute("SELECT count(*) FROM sqlite_master").fetchone()
    return conn


def resolve_schema(conn):
    """探测消息表与列名, 兼容不同版本"""
    tables = [r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'")]
    tname = next((t for t in TABLE_CANDIDATES if t in tables), None)
    if not tname:
        raise RuntimeError(f"没找到消息表, 实际表列表: {tables}")
    cols = [r[1] for r in conn.execute(f'PRAGMA table_info("{tname}")')]
    pick = lambda cands: next((c for c in cands if c in cols), None)
    schema = dict(
        table=tname,
        id=pick(ID_COLS), time=pick(TIME_COLS), content=pick(CONTENT_COLS),
        chat=pick(CHAT_COLS), sender=pick(SENDER_COLS),
    )
    missing = [k for k, v in schema.items() if k != "table" and not v]
    if missing:
        log.warning("以下字段没匹配到(手动改脚本): %s | 表 %s 全部列: %s",
                    missing, tname, cols)
    return schema


def init_out():
    """本地存档库"""
    conn = sqlite3.connect(OUT_DB)
    conn.execute("""CREATE TABLE IF NOT EXISTS messages(
        msg_id   TEXT PRIMARY KEY,
        chat     TEXT,
        sender   TEXT,
        ts       INTEGER,
        content  TEXT,
        raw      TEXT,
        saved_at INTEGER
    )""")
    conn.commit()
    return conn


def fmt_content(v):
    if v is None:
        return ""
    if isinstance(v, bytes):
        try:
            return v.decode("utf-8")
        except UnicodeDecodeError:
            return f"[blob {len(v)}B] {base64.b64encode(v[:64]).decode()}"
    return str(v)


def collect(conn, schema, out, limit=500):
    """拉最近 limit 条消息, 去重入库, 返回新增条数"""
    cols = [schema["id"], schema["time"], schema["chat"],
            schema["sender"], schema["content"]]
    sel = ", ".join(f'"{c}"' for c in cols)
    sql = (f'SELECT {sel} FROM "{schema["table"]}" '
           f'ORDER BY "{schema["id"]}" DESC LIMIT {limit}')
    rows = conn.execute(sql).fetchall()
    added = 0
    for r in rows:
        msg_id, ts, chat, sender, content = r
        if msg_id is None:
            continue
        row = (str(msg_id), fmt_content(chat), fmt_content(sender),
               int(ts or 0), fmt_content(content), json.dumps(
                   {k: fmt_content(v) for k, v in
                    zip(("id", "time", "chat", "sender", "content"), r)},
                   ensure_ascii=False),
               int(time.time()))
        try:
            cur = out.execute(
                "INSERT OR IGNORE INTO messages VALUES (?,?,?,?,?,?,?)", row)
            added += cur.rowcount
        except sqlite3.IntegrityError:
            pass
    out.commit()
    return added


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--once", action="store_true", help="跑一次就退出")
    ap.add_argument("--interval", type=float, default=POLL_INTERVAL)
    args = ap.parse_args()

    db_path = pick_db()
    log.info("微信数据库: %s", db_path)
    conn = open_encrypted(db_path)
    schema = resolve_schema(conn)
    log.info("适配 schema: %s", schema)
    out = init_out()

    if args.once:
        added = collect(conn, schema, out, limit=10 ** 9)
        log.info("完成, 新增 %d 条 -> %s", added, OUT_DB)
        return

    log.info("开始轮询 (每 %.1fs), 存档: %s", args.interval, OUT_DB)
    while True:
        try:
            added = collect(conn, schema, out)
            if added:
                log.info("+%d 条新消息", added)
        except sqlite3.DatabaseError as e:
            log.error("读库失败(可能微信升级/密钥失效): %s", e)
        time.sleep(args.interval)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nbye")
        sys.exit(0)

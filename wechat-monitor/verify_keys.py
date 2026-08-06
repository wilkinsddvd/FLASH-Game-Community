#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
验证 hunted_keys.txt 中的密钥并生成 keys.json
用法: python3 verify_keys.py
输入: hunted_keys.txt (keyhunt/lldb 截获的 32字节密钥, 每行一个hex)
输出: keys.json (db路径 -> {enc_key, salt})  — 与 wx_monitor.py 对接
"""
import glob
import json
import os
import struct
import hashlib
import hmac as hmac_mod
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
HUNTED = HERE / "hunted_keys.txt"
OUT = HERE / "keys.json"

PAGE_SZ = 4096
SALT_SZ = 16
IV_SZ = 16
KEY_SZ = 32
HMAC_SZ = 64
RESERVE_SZ = 80

XWECHAT_GLOB = os.path.expanduser(
    "~/Library/Containers/com.tencent.xinWeChat/Data/Documents/"
    "xwechat_files/*/db_storage/*/*.db"
)


def collect_dbs():
    """收集所有加密 DB 及其 page1"""
    dbs = []
    for path in glob.glob(XWECHAT_GLOB):
        if path.endswith(("-wal", "-shm", "-journal", ".kvdb")):
            continue
        if path.endswith(("-fts.db",)):
            continue
        sz = os.path.getsize(path)
        if sz < PAGE_SZ:
            continue
        with open(path, 'rb') as fh:
            page1 = fh.read(PAGE_SZ)
        if page1[:16] == b'SQLite format 3\x00':
            continue
        dbs.append((path, page1))
    return dbs


def derive_mac_key(enc_key, salt, digest="sha512"):
    mac_salt = bytes(b ^ 0x3a for b in salt)
    return hashlib.pbkdf2_hmac(digest, enc_key, mac_salt, 2, dklen=KEY_SZ)


def check_page1(enc_key, salt, page1, digest, mac_sz, little_endian):
    reserve = ((IV_SZ + mac_sz + 15) // 16) * 16
    usable = PAGE_SZ - reserve
    hk = derive_mac_key(enc_key, salt, digest)
    hmac_in = page1[SALT_SZ: usable + IV_SZ]
    stored = page1[usable + IV_SZ: usable + IV_SZ + mac_sz]
    pgno = struct.pack("<I", 1) if little_endian else struct.pack(">I", 1)
    calc = hmac_mod.new(hk, hmac_in + pgno, getattr(hashlib, digest)).digest()
    return hmac_mod.compare_digest(calc, stored)


def verify_key(enc_key, page1):
    """多组合验证: HMAC-SHA512 LE/BE + HMAC-SHA256"""
    if len(enc_key) != KEY_SZ or len(page1) < PAGE_SZ:
        return False
    salt = page1[:SALT_SZ]
    return (check_page1(enc_key, salt, page1, "sha512", 64, True)
            or check_page1(enc_key, salt, page1, "sha512", 64, False)
            or check_page1(enc_key, salt, page1, "sha256", 32, True))


def main():
    if not HUNTED.exists():
        print(f"[!] 没有 {HUNTED}")
        print("    先运行:  sudo ./hunt.sh   (然后在微信里点开聊天触发解密)")
        sys.exit(1)

    lines = [l.strip() for l in HUNTED.read_text().splitlines() if l.strip()]
    keys = []
    for l in lines:
        try:
            k = bytes.fromhex(l)
        except ValueError:
            continue
        if len(k) == 32 and k not in keys:
            keys.append(k)

    print(f"截获密钥 {len(keys)} 个 (去重后)")

    dbs = collect_dbs()
    print(f"加密数据库 {len(dbs)} 个")

    result = {}
    matched = 0
    for path, page1 in dbs:
        salt = page1[:SALT_SZ].hex()
        found = None
        for k in keys:
            if verify_key(k, page1):
                found = k.hex()
                break
        if found:
            result[path] = {"enc_key": found, "salt": salt}
            matched += 1
            print(f"  [OK] {os.path.basename(path)}  enc_key={found}")
        else:
            print(f"  [X]  {os.path.basename(path)}  未匹配")

    OUT.write_text(json.dumps(result, indent=2))
    print(f"\n结果: {matched}/{len(dbs)} 个库找到密钥 -> {OUT}")

    if matched == 0:
        print("\n[!] 一个都没匹配上。可能原因:")
        print("    - 截获的密钥是图片/其他用途的AES key, 不是DB key")
        print("    - 微信没有触发 message_0.db 解密 (去点开一个聊天窗口)")
        print("    - 需要更多不同时机的密钥 (多开几个聊天/朋友圈/收藏)")
        sys.exit(1)


if __name__ == "__main__":
    main()

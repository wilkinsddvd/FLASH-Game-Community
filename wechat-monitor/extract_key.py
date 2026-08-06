#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信 4.x (macOS) 数据库密钥提取器
==================================
原理: 微信 4.x 运行时会把每个数据库的解密密钥缓存在进程内存中,
      格式为 x'<64hex_enc_key><32hex_salt>' (SQLCipher4: AES-256-CBC,
      HMAC-SHA512, reserve=80, page_size=4096)。
      本脚本用 Mach VM API (task_for_pid) 读取微信进程内存,
      扫描该模式并用每个 DB 文件头部 16 字节的 salt + Page1 HMAC 验证。

用法: sudo python3 extract_key.py
输出: keys.json  (salt -> enc_key 映射)

参考: kknd0/wechat-decrypt-mac (GitHub, 思路与实现)
"""

import ctypes
import ctypes.util
import glob
import hashlib
import hmac as hmac_mod
import json
import os
import re
import struct
import subprocess
import sys
import time

# ---------------- 常量 ----------------
PAGE_SZ = 4096
KEY_SZ = 32
SALT_SZ = 16
IV_SZ = 16
HMAC_SZ = 64
RESERVE_SZ = 80

# 微信 4.x 数据目录 (新版 xwechat_files 结构)
XWECHAT_GLOB = os.path.expanduser(
    "~/Library/Containers/com.tencent.xinWeChat/Data/Documents/"
    "xwechat_files/*/db_storage/*/*.db"
)
OUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "keys.json")

# ---------------- Mach VM API ----------------
KERN_SUCCESS = 0
VM_PROT_READ = 1
VM_REGION_BASIC_INFO_64 = 9
VM_REGION_BASIC_INFO_COUNT_64 = 9

libc = ctypes.CDLL(ctypes.util.find_library("c"))
mach_port_t = ctypes.c_uint32
mach_vm_address_t = ctypes.c_uint64
mach_vm_size_t = ctypes.c_uint64
vm_prot_t = ctypes.c_int32
mach_msg_type_number_t = ctypes.c_uint32


class vm_region_basic_info_64(ctypes.Structure):
    _fields_ = [
        ("protection", vm_prot_t),
        ("max_protection", vm_prot_t),
        ("inheritance", ctypes.c_uint32),
        ("shared", ctypes.c_uint32),
        ("reserved", ctypes.c_uint32),
        ("offset", ctypes.c_uint64),
        ("behavior", ctypes.c_int32),
        ("user_wired_count", ctypes.c_uint16),
    ]


def get_pid():
    r = subprocess.run(["pgrep", "-x", "WeChat"], capture_output=True, text=True)
    if r.returncode != 0 or not r.stdout.strip():
        print("[ERROR] 微信未运行! 请先打开微信登录。")
        sys.exit(1)
    pids = [int(p) for p in r.stdout.strip().split('\n') if p.strip()]
    best = (0, 0)
    for pid in pids:
        try:
            ps = subprocess.run(["ps", "-o", "rss=", "-p", str(pid)],
                                capture_output=True, text=True)
            rss = int(ps.stdout.strip()) if ps.stdout.strip() else 0
            if rss > best[1]:
                best = (pid, rss)
        except (ValueError, subprocess.SubprocessError):
            if not best[0]:
                best = (pid, 0)
    print(f"[+] WeChat PID={best[0]} ({best[1] // 1024}MB RSS)")
    return best[0]


def task_for_pid(pid):
    task = mach_port_t()
    self_task = libc.mach_task_self()
    kr = libc.task_for_pid(self_task, ctypes.c_int(pid), ctypes.byref(task))
    if kr != KERN_SUCCESS:
        print(f"[ERROR] task_for_pid 失败 (kr={kr})")
        print("  请使用 sudo 运行:  sudo python3 extract_key.py")
        sys.exit(1)
    return task.value


def enum_regions(task):
    regions = []
    address = mach_vm_address_t(0)
    size = mach_vm_size_t(0)
    info = vm_region_basic_info_64()
    info_count = mach_msg_type_number_t(VM_REGION_BASIC_INFO_COUNT_64)
    object_name = mach_port_t()
    while True:
        info_count.value = VM_REGION_BASIC_INFO_COUNT_64
        kr = libc.mach_vm_region(
            mach_port_t(task), ctypes.byref(address), ctypes.byref(size),
            VM_REGION_BASIC_INFO_64, ctypes.byref(info),
            ctypes.byref(info_count), ctypes.byref(object_name))
        if kr != KERN_SUCCESS:
            break
        if (info.protection & VM_PROT_READ) and 0 < size.value < 500 * 1024 * 1024:
            regions.append((address.value, size.value))
        next_addr = address.value + size.value
        if next_addr <= address.value:
            break
        address.value = next_addr
    return regions


def read_mem(task, addr, sz):
    buf = ctypes.create_string_buffer(sz)
    out_size = mach_vm_size_t(0)
    kr = libc.mach_vm_read_overwrite(
        mach_port_t(task), mach_vm_address_t(addr), mach_vm_size_t(sz),
        ctypes.cast(buf, mach_vm_address_t), ctypes.byref(out_size))
    if kr == KERN_SUCCESS and out_size.value > 0:
        return buf.raw[:out_size.value]
    return None


# ---------------- 密钥验证 ----------------
def derive_mac_key(enc_key, salt):
    mac_salt = bytes(b ^ 0x3a for b in salt)
    return hashlib.pbkdf2_hmac("sha512", enc_key, mac_salt, 2, dklen=KEY_SZ)


def verify_key_for_db(enc_key, db_page1):
    """用 Page1 的 HMAC 验证 enc_key 是否正确"""
    salt = db_page1[:SALT_SZ]
    mac_key = derive_mac_key(enc_key, salt)
    hmac_data = db_page1[SALT_SZ: PAGE_SZ - RESERVE_SZ + IV_SZ]
    stored_hmac = db_page1[PAGE_SZ - HMAC_SZ: PAGE_SZ]
    h = hmac_mod.new(mac_key, hmac_data, hashlib.sha512)
    h.update(struct.pack('<I', 1))
    return h.digest() == stored_hmac


# ---------------- 主流程 ----------------
def main():
    print("=" * 60)
    print("  微信 4.x (macOS) 内存密钥提取")
    print("=" * 60)

    # 1. 收集所有加密 DB 及其 salt
    db_files = []
    salt_to_dbs = {}
    for path in glob.glob(XWECHAT_GLOB):
        if path.endswith(("-wal", "-shm", "-journal")):
            continue
        if path.endswith(".kvdb"):
            continue
        sz = os.path.getsize(path)
        if sz < PAGE_SZ:
            continue
        with open(path, 'rb') as fh:
            page1 = fh.read(PAGE_SZ)
        if page1[:16] == b'SQLite format 3\x00':
            continue  # 未加密
        salt = page1[:SALT_SZ].hex()
        rel = path.replace(os.path.expanduser("~"), "~")
        db_files.append((rel, path, sz, salt, page1))
        salt_to_dbs.setdefault(salt, []).append(rel)

    if not db_files:
        print("[ERROR] 没找到加密数据库! 检查路径:", XWECHAT_GLOB)
        sys.exit(1)

    print(f"\n找到 {len(db_files)} 个加密数据库, {len(salt_to_dbs)} 个不同 salt")
    for salt_hex, dbs in sorted(salt_to_dbs.items(), key=lambda x: len(x[1]), reverse=True):
        print(f"  salt {salt_hex}: {', '.join(dbs)}")

    # 2. 读取进程内存
    pid = get_pid()
    task = task_for_pid(pid)
    regions = enum_regions(task)
    total_mb = sum(s for _, s in regions) / 1024 / 1024
    print(f"[+] 可读内存: {len(regions)} 区域, {total_mb:.0f}MB")

    # 3. 扫描 x'<hex>' 模式
    print("\n扫描内存中的缓存密钥...")
    hex_re = re.compile(b"x'([0-9a-fA-F]{64,192})'")
    key_map = {}
    t0 = time.time()

    for reg_idx, (base, size) in enumerate(regions):
        data = read_mem(task, base, size)
        if not data:
            continue
        for m in hex_re.finditer(data):
            hex_str = m.group(1).decode()
            addr = base + m.start()
            hex_len = len(hex_str)
            if hex_len == 96:
                enc_key_hex, salt_hex = hex_str[:64], hex_str[64:]
            elif hex_len == 64:
                enc_key_hex, salt_hex = hex_str, None
            elif hex_len > 96 and hex_len % 2 == 0:
                enc_key_hex, salt_hex = hex_str[:64], hex_str[-32:]
            else:
                continue
            if salt_hex in salt_to_dbs and salt_hex not in key_map:
                enc_key = bytes.fromhex(enc_key_hex)
                for rel, path, sz, s, page1 in db_files:
                    if s == salt_hex and verify_key_for_db(enc_key, page1):
                        key_map[salt_hex] = enc_key_hex
                        print(f"  [FOUND] salt={salt_hex}")
                        print(f"    enc_key={enc_key_hex}")
                        print(f"    地址: 0x{addr:016X}")
                        print(f"    数据库: {', '.join(salt_to_dbs[salt_hex])}")
                        break
            elif salt_hex is None:
                # 64hex 无 salt: 对未匹配的 DB 逐个验证
                enc_key = bytes.fromhex(enc_key_hex)
                for rel, path, sz, s, page1 in db_files:
                    if s not in key_map and verify_key_for_db(enc_key, page1):
                        key_map[s] = enc_key_hex
                        print(f"  [FOUND] salt={s} enc_key={enc_key_hex} (no-salt模式)")
                        break

        if (reg_idx + 1) % 200 == 0:
            print(f"  进度 {reg_idx + 1}/{len(regions)} 区域, "
                  f"已找到 {len(key_map)}/{len(salt_to_dbs)}")

    print(f"\n扫描完成: {time.time() - t0:.1f}s")

    # 4. 输出
    result = {}
    for rel, path, sz, salt_hex, page1 in db_files:
        if salt_hex in key_map:
            result[path] = {"enc_key": key_map[salt_hex], "salt": salt_hex}
            print(f"  OK: {rel}")
        else:
            print(f"  MISSING: {rel} (salt={salt_hex})")

    with open(OUT_FILE, 'w') as f:
        json.dump(result, f, indent=2)
    print(f"\n密钥已保存: {OUT_FILE}")

    missing = [rel for rel, *_ in [(r, p, s, sa, p1) for r, p, s, sa, p1 in db_files]
               if sa not in key_map]
    if missing:
        print(f"\n[!] 有 {len(missing)} 个数据库未找到密钥:")
        for rel in missing:
            print(f"    {rel}")
        print("  提示: 打开微信后点开对应聊天窗口再重试 (触发密钥缓存)")


if __name__ == '__main__':
    if os.geteuid() != 0:
        print("[!] 需要 root 权限读取微信进程内存")
        print("    请运行:  sudo python3 extract_key.py")
        sys.exit(1)
    main()

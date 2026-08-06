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
LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "extract.log")

# 输出同时写入日志文件（tee）
import sys
_orig_stdout = sys.stdout
_log_fh = open(LOG_FILE, "w", encoding="utf-8")
class _Tee:
    def write(self, s):
        _orig_stdout.write(s)
        _log_fh.write(s)
    def flush(self):
        _orig_stdout.flush()
        _log_fh.flush()
sys.stdout = _Tee()

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
        if kr == 5:
            print()
            print("  原因: 微信开启了 Hardened Runtime, 即使 root 也无法读取其内存。")
            print("  解决: 去掉加固签名后重启微信 (一次性操作):")
            print()
            print("    1. 退出微信")
            print("    2. sudo codesign --force --deep --sign - /Applications/WeChat.app")
            print("    3. 重新打开微信并登录")
            print("    4. 重新运行本脚本")
            print()
            print("  提示: 微信升级后需重新执行第 2 步。")
        else:
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
    """读取进程内存"""
    buf = ctypes.create_string_buffer(sz)
    out_size = mach_vm_size_t(0)
    kr = libc.mach_vm_read_overwrite(
        mach_port_t(task), mach_vm_address_t(addr), mach_vm_size_t(sz),
        mach_vm_address_t(ctypes.addressof(buf)), ctypes.byref(out_size))
    if kr == KERN_SUCCESS and out_size.value > 0:
        return buf.raw[:out_size.value]
    return None


# 设置 argtypes 确保 64 位地址正确传递 (Apple Silicon)
libc.mach_vm_read_overwrite.argtypes = [
    mach_port_t, mach_vm_address_t, mach_vm_size_t,
    mach_vm_address_t, ctypes.POINTER(mach_vm_size_t)]
libc.mach_vm_read_overwrite.restype = ctypes.c_int
libc.mach_vm_region.argtypes = [
    mach_port_t, ctypes.POINTER(mach_vm_address_t),
    ctypes.POINTER(mach_vm_size_t), ctypes.c_int,
    ctypes.POINTER(vm_region_basic_info_64),
    ctypes.POINTER(mach_msg_type_number_t), ctypes.POINTER(mach_port_t)]
libc.mach_vm_region.restype = ctypes.c_int


# ---------------- 密钥验证 (支持多组合 fallback) ----------------
def derive_mac_key(enc_key, salt, digest="sha512"):
    mac_salt = bytes(b ^ 0x3a for b in salt)
    return hashlib.pbkdf2_hmac(digest, enc_key, mac_salt, 2, dklen=KEY_SZ)


def check_page1(enc_key, salt, page1, digest, mac_sz, little_endian):
    """单组合校验 Page1 HMAC"""
    reserve = ((IV_SZ + mac_sz + 15) // 16) * 16
    usable = PAGE_SZ - reserve
    hk = derive_mac_key(enc_key, salt, digest)
    hmac_in = page1[SALT_SZ: usable + IV_SZ]
    stored = page1[usable + IV_SZ: usable + IV_SZ + mac_sz]
    pgno = struct.pack("<I", 1) if little_endian else struct.pack(">I", 1)
    calc = hmac_mod.new(hk, hmac_in + pgno, getattr(hashlib, digest)).digest()
    return hmac_mod.compare_digest(calc, stored)


def verify_key_for_db(enc_key, db_page1):
    """用 Page1 的 HMAC 验证 enc_key 是否正确 (多组合 fallback)"""
    if len(enc_key) != KEY_SZ or len(db_page1) < PAGE_SZ:
        return False
    salt = db_page1[:SALT_SZ]
    if check_page1(enc_key, salt, db_page1, "sha512", 64, True):
        return True
    if check_page1(enc_key, salt, db_page1, "sha512", 64, False):
        return True
    if check_page1(enc_key, salt, db_page1, "sha256", 32, True):
        return True
    return False


def verify_and_record(enc_key, db_files, salt_hex, key_map, addr=0, mode=""):
    """用候选 enc_key 验证所有未匹配的 DB, 成功则记录"""
    enc_key_bytes = bytes.fromhex(enc_key) if isinstance(enc_key, str) else enc_key
    for rel, path, sz, s, page1 in db_files:
        if s not in key_map and verify_key_for_db(enc_key_bytes, page1):
            key_map[s] = enc_key if isinstance(enc_key, str) else enc_key_bytes.hex()
            print(f"  [FOUND] salt={s} ({mode})")
            print(f"    enc_key={key_map[s]}")
            if addr:
                print(f"    地址: 0x{addr:016X}")
            print(f"    数据库: {', '.join(salt_to_dbs[s])}")
            return True
    return False


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

    # 3. 扫描内存中的密钥
    #    方式A: x'<hex>' 字符串模式 (老版本缓存格式)
    #    方式B: salt 锚定 + 周边窗口枚举 32 字节候选 (4.x 原始字节格式)
    print("\n扫描内存中的缓存密钥...")
    print(f"[+] 目标: {len(salt_to_dbs)} 个 salt, 内存 {total_mb:.0f}MB")
    hex_re = re.compile(b"x'([0-9a-fA-F]{64,192})'")
    # salt 原始字节 -> 待验证的 DB
    salt_bytes = {bytes.fromhex(s): s for s in salt_to_dbs}
    key_map = {}
    t0 = time.time()
    WINDOW = 512  # salt 前后窗口大小, 找 key 候选

    for reg_idx, (base, size) in enumerate(regions):
        data = read_mem(task, base, size)
        if not data:
            continue

        # 方式A: x'<hex>' 模式
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
            if salt_hex in salt_to_dbs:
                verify_and_record(enc_key_hex, db_files, salt_hex, key_map, addr, "x'hex'")
            elif salt_hex is None:
                verify_and_record(enc_key_hex, db_files, None, key_map, addr, "x'hex'-nosalt")

        # 方式B: salt 锚定窗口扫描 (仅在方式A未全部命中时)
        if len(key_map) < len(salt_to_dbs):
            for salt_raw, salt_hex in salt_bytes.items():
                if salt_hex in key_map:
                    continue
                start = 0
                while True:
                    idx = data.find(salt_raw, start)
                    if idx < 0:
                        break
                    addr = base + idx
                    lo = max(0, idx - WINDOW)
                    hi = min(len(data), idx + len(salt_raw) + WINDOW)
                    chunk = data[lo:hi]
                    # 在窗口内枚举所有 32 字节候选 (步长 1, 仅扫开头像 key 的)
                    for off in range(len(chunk) - KEY_SZ + 1):
                        cand = chunk[off:off + KEY_SZ]
                        # 快速预筛: 全零/全FF 跳过
                        if cand == b'\x00' * KEY_SZ or cand == b'\xff' * KEY_SZ:
                            continue
                        if verify_and_record(cand.hex(), db_files, salt_hex, key_map,
                                             addr - (idx - lo) + off, "salt-window"):
                            break
                    start = idx + 1

        if (reg_idx + 1) % 100 == 0 or (reg_idx + 1) == len(regions):
            print(f"  进度 {reg_idx + 1}/{len(regions)} 区域, "
                  f"已找到 {len(key_map)}/{len(salt_to_dbs)}, "
                  f"耗时 {time.time() - t0:.0f}s", flush=True)

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
    print(f"完整日志: {LOG_FILE}")

    missing = [rel for rel, path, sz, salt_hex, page1 in db_files
               if salt_hex not in key_map]
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

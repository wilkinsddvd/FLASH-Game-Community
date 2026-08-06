# lldb intercept: log every 32-byte AES key passed to CommonCrypto in WeChat.
# 原理: 微信 4.1.10+ 的 WCDB 用 CommonCrypto 做 AES 后端, 密钥只在使用瞬间
#       出现在 CCCrypt 参数寄存器里 (arm64: key=x3 keyLen=x4;
#       CCCryptorCreateWithMode: key=x5 keyLen=x6)。hook 住即可截获每库密钥。
#
# 用法 (附加到已去签名的微信):
#   sudo lldb -p <PID> -o "command script import .../keyhunt.py" -o "keyhunt_start" -o "continue"
# 然后在微信里点开聊天/朋友圈/收藏 触发数据库页解密, Ctrl-C 停止。
#
# 参考: Evanyuan-builder/wechat-4.1.10-macos-key (MIT-ish, 思路与实现)

import lldb, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "hunted_keys.txt")
_seen = set()


def _log_key(frame, key_reg, len_reg):
    try:
        klen = frame.FindRegister(len_reg).GetValueAsUnsigned()
    except Exception:
        return
    if klen != 32:
        return
    kptr = frame.FindRegister(key_reg).GetValueAsUnsigned()
    if not kptr:
        return
    err = lldb.SBError()
    data = frame.GetThread().GetProcess().ReadMemory(kptr, 32, err)
    if not err.Success() or not data:
        return
    h = data.hex()
    if h in _seen:
        return
    _seen.add(h)
    with open(OUT, "a") as f:
        f.write(h + "\n")
    print("KEY32:", h, flush=True)


def on_cccrypt(frame, bp_loc, extra, internal_dict):
    # CCCrypt(op,alg,options,key,keyLength,iv,...) -> arm64 key=x3 keyLen=x4
    _log_key(frame, "x3", "x4")
    return False  # auto-continue


def on_ccmode(frame, bp_loc, extra, internal_dict):
    # CCCryptorCreateWithMode(op,mode,alg,padding,iv,key,keyLength,...) -> key=x5 keyLen=x6
    _log_key(frame, "x5", "x6")
    return False


def keyhunt_start(debugger, command, result, internal_dict):
    open(OUT, "w").close()
    t = debugger.GetSelectedTarget()
    for name, cb in (("CCCrypt", "keyhunt.on_cccrypt"),
                     ("CCCryptorCreate", "keyhunt.on_cccrypt"),
                     ("CCCryptorCreateWithMode", "keyhunt.on_ccmode")):
        bp = t.BreakpointCreateByName(name)
        bp.SetScriptCallbackFunction(cb)
        print("bp %s -> %d locations" % (name, bp.GetNumLocations()), flush=True)
    print("keyhunt armed. writing 32-byte keys to " + OUT, flush=True)


def __lldb_init_module(debugger, internal_dict):
    debugger.HandleCommand("command script add -f keyhunt.keyhunt_start keyhunt_start")

#!/bin/bash
# 用 lldb 附加微信, 拦截 CCCrypt 截获数据库密钥
# 用法: sudo ./hunt.sh
# 之后: 在微信里点开聊天/朋友圈/收藏 触发解密 -> Ctrl-C 停止
#       然后运行 python3 verify_keys.py 验证并生成 keys.json

cd "$(dirname "$0")"
PID=$(pgrep -x WeChat | head -1)
[ -z "$PID" ] && { echo "微信未运行"; exit 1; }
echo ">>> 附加 lldb 到微信 PID=$PID, 布防 CCCrypt 断点..."
echo ">>> 出现 'armed' 后切到微信, 点开聊天/朋友圈/收藏 触发数据库解密"
echo ">>> 截获的 32 字节密钥追加写入 hunted_keys.txt, Ctrl-C 后输入 quit 退出"
exec lldb -p "$PID" \
  -o "command script import $(pwd)/keyhunt.py" \
  -o "keyhunt_start" \
  -o "continue"

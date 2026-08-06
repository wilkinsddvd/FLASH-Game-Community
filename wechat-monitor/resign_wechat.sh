#!/bin/bash
# 去掉微信 Hardened Runtime 加固签名（一次性，微信升级后需重跑）
# 用法: sudo ./resign_wechat.sh

set -e
APP="/Applications/WeChat.app"

echo "[1/2] 退出微信..."
osascript -e 'quit app "WeChat"' 2>/dev/null || true
sleep 2

echo "[2/2] 重新签名 (去掉 hardened runtime)..."
codesign --force --deep --sign - "$APP"

echo ""
echo "✅ 完成! 现在:"
echo "   1. 打开微信并登录"
echo "   2. sudo .venv/bin/python3 extract_key.py"

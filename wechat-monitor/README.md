# wechat-monitor

macOS 微信消息监控 —— 纯 Python 读库方案（天然"防撤回"）。

## 原理

微信 Mac 版聊天记录存在本地 SQLCipher 加密的 SQLite 库 (`msg_*.db`) 中。
消息到达即落盘，撤回只是改标记/隐藏，数据仍在本地 —— 所以读库方案天然能拿到"已撤回"的内容。

```
微信 Mac 版 → msg_*.db (SQLCipher) → 密钥解密 → Python 轮询 → wechat_monitor.db
```

## 项目结构

```
wechat-monitor/
├── wx_monitor.py       # 主脚本（轮询 + 存档）
├── requirements.txt
└── README.md
```

## 快速开始

```bash
# 1. 安装依赖（sqlcipher3 是新维护的包，pysqlcipher3 在 macOS 上很难编译）
pip install -r requirements.txt

# 2. 设置数据库密钥（一次性搞定，版本相关，见下方说明）
export WECHAT_DB_KEY="<64位hex密钥>"

# 3. 测试：全量导入一次
python3 wx_monitor.py --once

# 4. 持续监控（默认 3 秒轮询，可用 --interval 调整）
python3 wx_monitor.py
```

## 密钥获取（WECHAT_DB_KEY）

版本相关，常见途径：

- 用 WeChatMsg（留痕）项目的密钥提取逻辑，能导出后把密钥抄下来
- `lldb` 附加微信进程，在内存中搜 64 位 hex 字符串
- 部分版本可从钥匙串读取

微信的 SQLCipher 常用 `page_size=4096`，脚本已默认设置。

## 输出

消息写入 `wechat_monitor.db`（SQLite），表 `messages`：

| 字段 | 说明 |
|------|------|
| msg_id | 消息 ID（主键，去重） |
| chat | 会话 ID |
| sender | 发送方 |
| ts | 消息时间戳 |
| content | 文本内容 / 图片 blob |
| raw | 原始行 JSON |
| saved_at | 存档时间 |

## 注意事项

- 微信升级可能导致密钥失效/表结构变化，脚本会报错提示，不会静默挂掉
- 建议关闭微信自动更新
- 修改/读取本地数据不违反协议，但请仅用于自己的数据，注意隐私

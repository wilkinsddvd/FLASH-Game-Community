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

微信 4.x 的数据库密钥缓存在微信进程内存中，需要从内存提取：

```bash
# 1. 若报 task_for_pid 失败 (kr=5): 微信启用了 Hardened Runtime，需先去掉加固签名
#    退出微信后执行（微信升级后需重做）:
sudo ./resign_wechat.sh
#    然后重新打开微信并登录

# 2. 提取密钥（需要 sudo + 微信保持运行）:
sudo .venv/bin/python3 extract_key.py
#    成功后在当前目录生成 keys.json，wx_monitor.py 会自动加载

# 3. 验证:
.venv/bin/python3 wx_monitor.py --once
```

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

## 文件说明

- `wx_monitor.py` — 监控主脚本（轮询读库 + 存档）
- `extract_key.py` — 从微信进程内存提取数据库密钥（需 sudo）
- `resign_wechat.sh` — 去掉微信 Hardened Runtime 加固签名（一次性，需 sudo）
- `keys.json` — 提取出的密钥（wx_monitor 自动加载）

## 注意事项

- 微信升级可能导致密钥失效/表结构变化，脚本会报错提示，不会静默挂掉
- 微信升级后需重新去签名 + 重新提取密钥（resign_wechat.sh + extract_key.py）
- 建议关闭微信自动更新
- 修改/读取本地数据不违反协议，但请仅用于自己的数据，注意隐私
- 提取密钥需修改微信签名（去掉 hardened runtime），微信更新时会被还原

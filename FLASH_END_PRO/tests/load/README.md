# FLASH 后端压力测试（Locust）

> ⚠️ **只压本地 / staging，严禁打生产。** 压测会产生大量写入（留言板等），生产库不要碰。

## 1. 安装

```bash
pip install -r requirements-dev.txt   # locust
```

## 2. 准备登录态 token（可选，但强烈建议）

登录接口需要图形验证码，Locust 无法自动识别，所以登录态请求用 JWT 注入：

```bash
cd FLASH_END_PRO
# 生成 20 个 token（测试用户不足会自动补建 loadtest_0001…）
python tests/load/prepare_tokens.py --count 20 --create

# 直接作为环境变量使用（--csv 只输出 token 串）
export LOCUST_TOKENS="$(python tests/load/prepare_tokens.py --count 20 --csv)"
```

补建的测试用户密码统一为 `LoadTest@123456`。

## 3. 运行

```bash
# 无 UI，阶梯加压 100 并发跑 3 分钟，出 HTML 报告
locust -f tests/load/locustfile.py --headless -u 100 -r 10 -t 3m \
       --host http://localhost:8000 --html report.html

# 带 Web UI（浏览器打开 http://localhost:8089）
locust -f tests/load/locustfile.py --host http://localhost:8000
```

## 4. 场景说明

| User 类 | 权重 | 行为 |
|---|---|---|
| `AnonUser` | 3 | 匿名浏览：banner / 文章 / 视频 / 编制 / 留言板 / 点赞 |
| `CaptchaUser` | 1 | 图形验证码（Pillow 绘制，CPU 敏感） |
| `LoginUser` | 1 | 登录接口（验证码前置校验路径，预期 400） |
| `AuthUser` | 7 | 登录态：浏览 + **站内信未读轮询** + 发留言 + 个人资料 |

## 5. 压测方法建议

1. **基线**：`-u 1` 跑 1 分钟，记录单请求延迟。
2. **阶梯加压**：`-u 10 / 50 / 100 / 200`，每档观察 RPS 与 p95/p99，找**拐点**（RPS 不再涨、延迟陡增）。
3. **长稳（soak）**：找到拐点后取 60~70% 并发跑 30 分钟，看内存/连接数是否泄漏。
4. **同步观测**：
   - MySQL：`SHOW GLOBAL STATUS LIKE 'Threads_connected'`、慢查询日志
   - Redis：`redis-cli info stats`
   - 容器/进程：`docker stats` 或 `top`，看 CPU 饱和在 uvicorn 还是 MySQL
5. **事后**：对最慢接口 `EXPLAIN` 验证索引（配合本次新增的复合索引）。

## 6. 已知限制

- **bcrypt 路径未真正压到**：验证码校验在密码校验之前，`LoginUser` 会命中 400。
  若要压 bcrypt，需在**测试环境**临时放开验证码（改代码或加测试开关），不要在共享/生产环境这么做。
- `AuthUser` 的写操作（发留言）会产生测试数据，测试后请清理 `message_board` 中的压测记录。

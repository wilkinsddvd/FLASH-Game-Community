"""
FLASH 后端压力测试脚本（Locust）

用法：
    # 无 UI 模式（推荐，跑完自动出报告）
    locust -f tests/load/locustfile.py --headless -u 100 -r 10 -t 3m \
           --host http://localhost:8000 --html report.html

    # 带 Web UI
    locust -f tests/load/locustfile.py --host http://localhost:8000

⚠️ 只针对本地 / staging 环境压测，**严禁打生产**。

登录接口需要图形验证码，Locust 无法自动识别，因此需要登录态的接口通过
`LOCUST_TOKENS` 注入 JWT（用 `prepare_tokens.py` 生成）：
    LOCUST_TOKENS="eyJ...,eyJ..." locust -f tests/load/locustfile.py --headless -u 50 --host ...
"""
import os
import random

from locust import HttpUser, between, events, task

TOKENS = [t.strip() for t in os.getenv("LOCUST_TOKENS", "").split(",") if t.strip()]

ARTICLES = ["/api/articles?category=news&page_size=4", "/api/articles?page_size=10"]


def _ok(resp, expect=(200, 201, 204)):
    """locust 默认把 4xx 也算失败；这里显式区分"""
    if resp.status_code in expect or resp.status_code < 400:
        resp.success()
    elif resp.status_code >= 500:
        resp.failure(f"服务端错误 {resp.status_code}")


@events.test_start.add_listener
def _warn(environment, **kwargs):
    if not TOKENS:
        print(
            "[load] ⚠️ 未设置 LOCUST_TOKENS，登录态接口将退化为匿名请求。"
            "先生成 token：python tests/load/prepare_tokens.py --count 20"
        )


class AnonUser(HttpUser):
    """匿名浏览（首页 / 攻略 / 编制 / 留言板）"""
    weight = 3
    wait_time = between(1, 4)

    @task(5)
    def home_bundle(self):
        for path in ("/api/banners", "/api/articles?category=news&page_size=4", "/api/videos"):
            with self.client.get(path, name=path.split("?")[0], catch_response=True) as resp:
                _ok(resp)

    @task(3)
    def articles(self):
        path = random.choice(ARTICLES)
        with self.client.get(path, name="/api/articles", catch_response=True) as resp:
            _ok(resp)

    @task(2)
    def squad(self):
        with self.client.get("/api/squad/public", catch_response=True) as resp:
            _ok(resp)

    @task(2)
    def message_board(self):
        with self.client.get("/api/message-board", catch_response=True) as resp:
            _ok(resp)

    @task(1)
    def likes(self):
        with self.client.get("/api/likes", catch_response=True) as resp:
            _ok(resp)


class CaptchaUser(HttpUser):
    """图形验证码：Pillow 动态绘制，CPU 敏感，单独压一压"""
    weight = 1
    wait_time = between(2, 5)

    @task
    def captcha(self):
        with self.client.get("/api/auth/captcha", catch_response=True) as resp:
            _ok(resp)


class LoginUser(HttpUser):
    """
    登录接口压力（验证码前置校验路径）。
    注：验证码由 Redis 存储且一次性，压测只能命中「验证码错误」分支（预期 400），
        bcrypt 校验需要在测试环境放开验证码后再压。
    """
    weight = 1
    wait_time = between(2, 6)

    @task
    def login(self):
        payload = {
            "username": f"loadtest_{random.randint(1, 9999)}",
            "password": "not-a-real-password",
            "captcha_id": "invalid",
            "captcha_code": "XXXX",
        }
        with self.client.post("/api/auth/login", json=payload, catch_response=True) as resp:
            _ok(resp, expect=(200, 400))


class AuthUser(HttpUser):
    """登录态行为（需 LOCUST_TOKENS）；无 token 时退化为匿名读"""
    weight = 7
    wait_time = between(1, 3)

    def on_start(self):
        self.token = random.choice(TOKENS) if TOKENS else None
        self.headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(5)
    def browse(self):
        for path in ("/api/videos", "/api/message-board", "/api/squad/public"):
            with self.client.get(path, name=path, headers=self.headers, catch_response=True) as resp:
                _ok(resp)

    @task(4)
    def unread_count(self):
        """站内信未读轮询（前端 60s 一次，高频接口）"""
        with self.client.get("/api/messages/unread-count", headers=self.headers, catch_response=True) as resp:
            _ok(resp, expect=(200, 401))

    @task(2)
    def my_profile(self):
        with self.client.get("/api/users/me", headers=self.headers, catch_response=True) as resp:
            _ok(resp, expect=(200, 401))

    @task(1)
    def post_message_board(self):
        if not self.token:
            return
        payload = {"content": f"压测留言 {random.randint(1000, 9999)}"}
        with self.client.post(
            "/api/message-board", json=payload, headers=self.headers, catch_response=True
        ) as resp:
            _ok(resp, expect=(200, 201, 401, 429))

    @task(1)
    def messages_list(self):
        with self.client.get("/api/messages", headers=self.headers, catch_response=True) as resp:
            _ok(resp, expect=(200, 401))

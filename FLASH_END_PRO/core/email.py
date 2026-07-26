"""
邮件发送模块 - SMTP SSL 发送验证邮件（纯文本，避免被拦截）
"""
import smtplib
import time
import hashlib
from email.mime.text import MIMEText
from email.header import Header
from typing import Literal

from core.config import settings


# 163 SMTP 风控：记录上次发送时间，保证间隔不低于 1 秒
_last_send_time: float = 0


def _wait_rate_limit():
    """163 风控规避：相邻邮件间隔不低于 1 秒"""
    global _last_send_time
    now = time.time()
    elapsed = now - _last_send_time
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)
    _last_send_time = time.time()


def send_verify_code(email_to: str, code: str, purpose: Literal["register", "reset"] = "register") -> None:
    """
    发送邮件验证码（纯文本）

    Args:
        email_to: 收件人邮箱
        code: 6 位数字验证码
        purpose: register=注册, reset=密码重置

    Raises:
        SMTPException: SMTP 连接/发送异常
        ValueError: 163 返回的拒绝原因
    """
    _wait_rate_limit()

    action_text = "注册" if purpose == "register" else "重置密码"

    text = (
        f"【FLASH游戏社区】您的验证码是：{code}\n"
        f"———\n"
        f"您好，\n\n"
        f"您正在进行{action_text}操作，验证码如下：\n\n"
        f">>> {code} <<<\n\n"
        f"验证码 5 分钟内有效，请勿泄露给他人。\n"
        f"如非本人操作，请忽略此邮件。\n"
        f"———\n"
        f"此邮件由系统自动发送，请勿回复"
    )

    msg = MIMEText(text, "plain", "utf-8")
    msg["Subject"] = Header(f"【FLASH游戏社区】您的验证码是：{code}", "utf-8")
    msg["From"] = settings.smtp_email
    msg["To"] = email_to
    msg["Reply-To"] = settings.smtp_email
    msg["X-Mailer"] = "FLASH-Game-Community/v1.0"
    # 内容去重：避免 163 判定为垃圾群发
    ts_hash = hashlib.md5(str(time.time()).encode()).hexdigest()[:8]
    msg["X-Message-ID"] = f"flash-{ts_hash}"

    try:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.login(settings.smtp_email, settings.smtp_password)
            server.sendmail(settings.smtp_email, [email_to], msg.as_string())
    except smtplib.SMTPServerDisconnected:
        # 重试一次
        time.sleep(1)
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.login(settings.smtp_email, settings.smtp_password)
            server.sendmail(settings.smtp_email, [email_to], msg.as_string())
    except smtplib.SMTPResponseException as e:
        smtp_code = e.smtp_code
        if smtp_code == 550:
            raise ValueError("该邮箱地址无效")
        elif smtp_code == 554:
            raise ValueError("发送过于频繁，请稍后再试")
        raise

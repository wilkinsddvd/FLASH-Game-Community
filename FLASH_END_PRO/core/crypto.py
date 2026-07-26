"""
邮箱地址 AES-256 加密/解密 + 哈希查询模块
"""
import hashlib
from cryptography.fernet import Fernet
import base64

from core.config import settings


def _get_fernet() -> Fernet:
    raw_key = settings.email_encrypt_key.encode("utf-8")
    key = base64.urlsafe_b64encode(hashlib.sha256(raw_key).digest())
    return Fernet(key)


def encrypt_email(email: str) -> str:
    """加密邮箱地址（非确定性，每轮加密结果不同）"""
    fernet = _get_fernet()
    token = fernet.encrypt(email.strip().lower().encode("utf-8"))
    return token.decode("utf-8")


def decrypt_email(encrypted: str) -> str:
    """解密邮箱地址"""
    fernet = _get_fernet()
    return fernet.decrypt(encrypted.encode("utf-8")).decode("utf-8")


def hash_email(email: str) -> str:
    """
    邮箱确定性哈希（SHA-256），用于数据库查询匹配
    注意：这不是加密，仅用于索引查找
    """
    return hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()

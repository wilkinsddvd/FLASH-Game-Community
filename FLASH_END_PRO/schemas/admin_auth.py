"""
管理员注册 & 口令管理 Pydantic 模型
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AdminRegisterRequest(BaseModel):
    """用户名+口令 管理员注册"""
    username: str = Field(..., min_length=3, max_length=20, description="用户名，3-20位字母数字下划线")
    password: str = Field(..., min_length=8, max_length=128, description="密码，最少8位，需包含字母+数字")
    passphrase: str = Field(..., min_length=6, max_length=128, description="管理员口令")


class AdminEmailRegisterRequest(BaseModel):
    """邮箱+口令 管理员注册"""
    email: str = Field(..., description="邮箱地址")
    code: str = Field(..., min_length=6, max_length=6, description="6位验证码")
    password: str = Field(..., min_length=8, max_length=128, description="密码，最少8位，需包含字母+数字")
    confirm_password: str = Field(..., min_length=8, max_length=128, description="确认密码")
    passphrase: str = Field(..., min_length=6, max_length=128, description="管理员口令")


class PassphraseUpdateRequest(BaseModel):
    """修改管理员口令"""
    old_passphrase: str = Field(..., min_length=1, description="当前口令")
    new_passphrase: str = Field(..., min_length=6, max_length=128, description="新口令")
    confirm_passphrase: str = Field(..., min_length=6, max_length=128, description="确认新口令")


class PassphraseInfo(BaseModel):
    """口令状态"""
    exists: bool
    updated_at: Optional[datetime] = None

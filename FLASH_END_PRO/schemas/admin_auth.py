"""
管理员注册 & 口令管理 Pydantic 模型
"""
import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class AdminRegisterRequest(BaseModel):
    """用户名+口令 管理员注册"""
    username: str = Field(..., min_length=3, max_length=20, description="用户名，3-20位字母数字下划线")
    password: str = Field(..., min_length=8, max_length=128, description="密码，最少8位，需包含字母+数字")
    passphrase: str = Field(..., min_length=6, max_length=128, description="管理员口令")

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("用户名只能包含字母、数字和下划线")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.search(r"[a-zA-Z]", v) or not re.search(r"[0-9]", v):
            raise ValueError("密码必须包含字母和数字")
        return v


class AdminEmailRegisterRequest(BaseModel):
    """邮箱+口令 管理员注册"""
    email: str = Field(..., description="邮箱地址")
    code: str = Field(..., min_length=6, max_length=6, description="6位验证码")
    password: str = Field(..., min_length=8, max_length=128, description="密码，最少8位，需包含字母+数字")
    confirm_password: str = Field(..., min_length=8, max_length=128, description="确认密码")
    passphrase: str = Field(..., min_length=6, max_length=128, description="管理员口令")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("邮箱格式不正确")
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.search(r"[a-zA-Z]", v) or not re.search(r"[0-9]", v):
            raise ValueError("密码必须包含字母和数字")
        return v

    @field_validator("confirm_password")
    @classmethod
    def validate_confirm(cls, v: str, info) -> str:
        password = info.data.get("password")
        if password and v != password:
            raise ValueError("两次输入的密码不一致")
        return v


class PassphraseCreateRequest(BaseModel):
    """新增管理员口令"""
    passphrase: str = Field(..., min_length=6, max_length=128, description="新口令，至少6位")
    confirm_passphrase: str = Field(..., min_length=6, max_length=128, description="确认新口令")

    @field_validator("confirm_passphrase")
    @classmethod
    def validate_confirm(cls, v: str, info) -> str:
        passphrase = info.data.get("passphrase")
        if passphrase and v != passphrase:
            raise ValueError("两次输入的口令不一致")
        return v


class PassphraseOut(BaseModel):
    """口令列表项（不暴露哈希）"""
    id: int
    use_count: int
    is_builtin: bool
    max_uses: int = 5
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @property
    def remaining_uses(self) -> int:
        return max(self.max_uses - self.use_count, 0)


class PassphraseListResponse(BaseModel):
    """口令池列表"""
    items: list[PassphraseOut]
    total: int
    max_uses: int = 5

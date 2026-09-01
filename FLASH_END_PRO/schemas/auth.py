from __future__ import annotations
from pydantic import BaseModel, Field, field_validator, EmailStr
import re


# ── 原有 ──

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=20, description="用户名，3-20位字母数字下划线")
    password: str = Field(..., min_length=8, max_length=128, description="密码，最少8位，需包含字母+数字")

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


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserInfo(BaseModel):
    id: int
    uid: int
    username: str
    nickname: str | None = None
    avatar: str | None = None
    email: str | None = None
    registration_method: str = "normal"
    status: int
    role: str = "guest"

    class Config:
        from_attributes = True


# ── 邮箱注册 ──

class EmailSendCodeRequest(BaseModel):
    email: str = Field(..., description="邮箱地址")
    purpose: str = Field("register", description="用途: register=注册, login=登录, reset=找回密码")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("邮箱格式不正确")
        return v.strip().lower()

    @field_validator("purpose")
    @classmethod
    def validate_purpose(cls, v: str) -> str:
        if v not in ("register", "login", "reset"):
            raise ValueError("purpose 必须是 register/login/reset")
        return v


class EmailSendCodeResponse(BaseModel):
    message: str = "验证码已发送至您的邮箱，请查收"


class EmailRegisterRequest(BaseModel):
    email: str = Field(..., description="邮箱地址")
    code: str = Field(..., min_length=6, max_length=6, description="6位验证码")
    password: str = Field(..., min_length=8, max_length=128, description="密码，最少8位，需包含字母+数字")
    confirm_password: str = Field(..., min_length=8, max_length=128, description="确认密码")

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


class EmailLoginRequest(BaseModel):
    """邮箱验证码登录（输入邮箱 → 获取验证码 → 验证码登录）"""
    email: str = Field(..., description="邮箱地址")
    code: str = Field(..., min_length=6, max_length=6, description="6位验证码")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("邮箱格式不正确")
        return v.strip().lower()


class EmailResetRequest(BaseModel):
    """发送密码重置验证码"""
    email: str = Field(..., description="注册邮箱")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("邮箱格式不正确")
        return v.strip().lower()


class EmailResetConfirmRequest(BaseModel):
    """密码重置-设置新密码"""
    email: str = Field(..., description="邮箱地址")
    code: str = Field(..., min_length=6, max_length=6, description="6位验证码")
    new_password: str = Field(..., min_length=8, max_length=128, description="新密码，最少8位，需包含字母+数字")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("邮箱格式不正确")
        return v.strip().lower()

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.search(r"[a-zA-Z]", v) or not re.search(r"[0-9]", v):
            raise ValueError("密码必须包含字母和数字")
        return v

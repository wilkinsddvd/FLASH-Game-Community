"""第三方登录（微信）相关 Schema —— 预留"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class WechatAuthorizeUrlOut(BaseModel):
    """授权跳转地址"""
    url: str
    state: str = Field(..., description="防 CSRF 随机串，回调时需原样带回")


class WechatCallbackIn(BaseModel):
    """微信授权回调参数"""
    code: str = Field(..., min_length=1, description="微信返回的临时授权码")
    state: Optional[str] = Field(None, description="与发起授权时的 state 校验")


class OauthBindingOut(BaseModel):
    """绑定信息（对外，不含 openid 明文）"""
    id: int
    provider: str
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    bound_at: datetime

    class Config:
        from_attributes = True


class OauthBindIn(BaseModel):
    """绑定请求（微信授权码）"""
    code: str = Field(..., min_length=1)
    state: Optional[str] = None

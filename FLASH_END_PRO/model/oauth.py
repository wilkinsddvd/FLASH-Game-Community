"""
第三方登录绑定表（预留）

设计说明（2026-10 预留，尚未接入真实微信登录）：
- 采用「独立绑定表」而非给 users 加列：一个用户可绑定多个第三方账号，且未来可扩展 QQ / 手机号 / 微博等
- openid：同一微信应用内的用户唯一标识（**账号绑定的主键**）
- unionid：同一微信开放平台账号下多应用统一标识（跨端打通时用）
- 安全：openid/unionid 属个人信息，不对外暴露；对外统一用 users.uid
"""
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from db.db import Base


class UserOauth(Base):
    """第三方账号绑定"""
    __tablename__ = "user_oauth"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="关联的本站用户ID")
    provider = Column(String(16), nullable=False, default="wechat", comment="第三方平台: wechat/qq/...")
    openid = Column(String(64), nullable=False, comment="第三方应用内唯一标识（账号绑定主键）")
    unionid = Column(String(64), nullable=True, comment="开放平台统一标识（跨应用，可空）")
    nickname = Column(String(64), nullable=True, comment="第三方昵称（仅作参考，不覆盖本站昵称）")
    avatar_url = Column(String(512), nullable=True, comment="第三方头像")
    expires_at = Column(DateTime, nullable=True, comment="第三方 access_token 过期时间（如需要）")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    __table_args__ = (
        UniqueConstraint("provider", "openid", name="uq_oauth_provider_openid"),
        Index("ix_user_oauth_user_provider", "user_id", "provider"),
        Index("ix_user_oauth_unionid", "unionid"),
    )

    user = relationship("User", backref="oauth_bindings")

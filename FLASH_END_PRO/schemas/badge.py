from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class BadgeOut(BaseModel):
    id: int
    code: str
    name: str
    icon: str
    description: Optional[str] = None
    sort_order: int

    class Config:
        from_attributes = True


class UserBadgeOut(BadgeOut):
    """用户勋章（含获取时间/来源）"""
    source: Optional[str] = None
    earned_at: Optional[datetime] = None

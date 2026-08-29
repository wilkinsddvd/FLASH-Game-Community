"""
站内信 Pydantic 模型
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class MessageOut(BaseModel):
    """消息输出"""
    id: int
    sender_id: Optional[int] = None
    sender_username: Optional[str] = None
    receiver_id: int
    type: str
    title: str
    content: str
    related_type: Optional[str] = None
    related_id: Optional[int] = None
    is_read: int
    created_at: datetime

    class Config:
        from_attributes = True


class UnreadCountOut(BaseModel):
    """未读消息数"""
    count: int


class SystemNoticeCreate(BaseModel):
    """发送系统通知"""
    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1, max_length=10000)


class SystemNoticeOut(BaseModel):
    """系统通知输出"""
    id: int
    title: str
    content: str
    created_at: datetime
    receiver_count: int = 0

    class Config:
        from_attributes = True

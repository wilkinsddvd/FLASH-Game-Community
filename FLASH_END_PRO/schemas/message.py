"""
站内信 Pydantic 模型
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    """发送私信"""
    receiver_id: Optional[int] = Field(None, description="接收者用户ID（与 receiver_username 二选一）")
    receiver_username: Optional[str] = Field(None, max_length=20, description="接收者用户名（与 receiver_id 二选一）")
    title: str = Field(default="", max_length=100, description="消息标题（可选）")
    content: str = Field(..., min_length=1, max_length=5000, description="消息内容")


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

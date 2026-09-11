"""留言板 Pydantic 模型"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MessageBoardCreate(BaseModel):
    """用户提交留言"""
    content: str = Field(..., min_length=1, max_length=500, description="留言内容")


class MessageBoardPublicOut(BaseModel):
    """留言板公开展示项（仅展示被管理员选中展示的留言）"""
    id: int
    content: str
    is_anonymous: int = 0
    display_name: Optional[str] = None
    created_at: Optional[datetime] = None


class MessageBoardAdminOut(BaseModel):
    """管理端留言项（含留言人信息与原始内容）"""
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    nickname: Optional[str] = None
    content: str
    original_content: Optional[str] = None
    is_displayed: int = 0
    is_anonymous: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

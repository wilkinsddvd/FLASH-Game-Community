from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ─── 板块 ───

class SectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    description: Optional[str] = None
    sort_order: int = 0


class SectionOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── 帖子 ───

class PostCreate(BaseModel):
    section_id: int = Field(..., description="板块ID")
    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1, description="富文本内容")


class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    content: Optional[str] = None


class PostStatusUpdate(BaseModel):
    status: str = Field(..., pattern=r"^(normal|locked|hidden|deleted)$")


class PostListItem(BaseModel):
    id: int
    title: str
    user_id: Optional[int] = None
    username: Optional[str] = None
    section_id: Optional[int] = None
    status: str
    view_count: int
    like_count: int
    favorite_count: int
    reply_count: int
    is_pinned: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PostDetail(BaseModel):
    id: int
    title: str
    content: str
    user_id: Optional[int] = None
    username: Optional[str] = None
    section_id: Optional[int] = None
    status: str
    view_count: int
    like_count: int
    favorite_count: int
    reply_count: int
    is_pinned: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── 回复 ───

class ReplyCreate(BaseModel):
    content: str = Field(..., min_length=1)
    parent_id: Optional[int] = None


class ReplyOut(BaseModel):
    id: int
    post_id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    parent_id: Optional[int] = None
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── 互动 ───

class InteractionResponse(BaseModel):
    message: str
    liked: Optional[bool] = None
    favorited: Optional[bool] = None
    like_count: Optional[int] = None
    favorite_count: Optional[int] = None

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class VideoCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=128)
    bvid: str = Field(..., min_length=4, max_length=32, description="B站 BV 号")
    cover_url: Optional[str] = None
    sort_order: int = 0
    status: int = Field(1, ge=0, le=1)


class VideoUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=128)
    bvid: Optional[str] = Field(None, min_length=4, max_length=32)
    cover_url: Optional[str] = None
    sort_order: Optional[int] = None
    status: Optional[int] = Field(None, ge=0, le=1)


class VideoOut(BaseModel):
    id: int
    title: str
    bvid: str
    cover_url: Optional[str] = None
    sort_order: int
    status: int
    url: Optional[str] = None  # 拼接好的 B站链接
    created_at: datetime

    class Config:
        from_attributes = True

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ─── Banner ───

class BannerCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=128)
    image_url: str = Field(..., min_length=1, max_length=512)
    link_url: Optional[str] = None
    sort_order: int = 0


class BannerUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=128)
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    sort_order: Optional[int] = None
    status: Optional[int] = Field(None, ge=0, le=1)


class BannerOut(BaseModel):
    id: int
    title: str
    image_url: str
    link_url: Optional[str] = None
    sort_order: int
    status: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── 文章 ───

class ArticleCreate(BaseModel):
    category: str = Field(default="news", pattern=r"^(news|guide|developer)$")
    title: str = Field(..., min_length=1, max_length=128)
    summary: Optional[str] = Field(None, max_length=255)
    content: str = Field(..., min_length=1)
    cover_image: Optional[str] = None
    status: str = "published"


class ArticleUpdate(BaseModel):
    category: Optional[str] = Field(None, pattern=r"^(news|guide|developer)$")
    title: Optional[str] = Field(None, min_length=1, max_length=128)
    summary: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    cover_image: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r"^(published|draft)$")


class ArticleListItem(BaseModel):
    id: int
    category: str
    title: str
    summary: Optional[str] = None
    cover_image: Optional[str] = None
    author_id: Optional[int] = None
    author_name: Optional[str] = None
    view_count: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ArticleDetail(BaseModel):
    id: int
    category: str
    title: str
    summary: Optional[str] = None
    content: str
    cover_image: Optional[str] = None
    author_id: Optional[int] = None
    author_name: Optional[str] = None
    view_count: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── CMS 页面 ───

class CmsPageCreate(BaseModel):
    slug: str = Field(..., min_length=1, max_length=64, pattern=r"^[a-z0-9_-]+$")
    title: str = Field(..., min_length=1, max_length=128)
    content: str = Field(..., min_length=1)
    meta_title: Optional[str] = None
    meta_desc: Optional[str] = None
    status: str = "published"


class CmsPageUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=128)
    content: Optional[str] = None
    meta_title: Optional[str] = None
    meta_desc: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r"^(published|draft)$")


class CmsPageOut(BaseModel):
    id: int
    slug: str
    title: str
    content: str
    meta_title: Optional[str] = None
    meta_desc: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

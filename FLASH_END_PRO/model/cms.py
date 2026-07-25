from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, SmallInteger
from db.db import Base


class CmsPage(Base):
    """静态页面表（CMS）"""
    __tablename__ = "cms_pages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(64), unique=True, nullable=False, index=True, comment="URL标识")
    title = Column(String(128), nullable=False, comment="页面标题")
    content = Column(Text, nullable=False, comment="富文本内容")
    meta_title = Column(String(128), nullable=True, comment="SEO标题")
    meta_desc = Column(String(255), nullable=True, comment="SEO描述")
    status = Column(String(16), default="published", comment="状态: published/draft")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

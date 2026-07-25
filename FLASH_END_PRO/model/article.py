from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, SmallInteger, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from db.db import Base


class Article(Base):
    """资讯文章表"""
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(32), nullable=False, default="news", comment="分类: news=游戏资讯, guide=攻略, developer=开发者")
    title = Column(String(128), nullable=False, comment="文章标题")
    summary = Column(String(255), nullable=True, comment="摘要")
    content = Column(Text, nullable=False, comment="富文本内容")
    cover_image = Column(String(512), nullable=True, comment="封面图URL")
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(16), default="published", comment="状态: published/draft")
    view_count = Column(Integer, default=0, comment="浏览次数")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    author = relationship("User", backref="articles")

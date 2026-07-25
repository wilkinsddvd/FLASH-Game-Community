from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, SmallInteger
from sqlalchemy.orm import relationship
from db.db import Base


class Post(Base):
    """帖子表"""
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, comment="发帖用户ID")
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="SET NULL"), nullable=True, comment="所属板块ID")
    title = Column(String(100), nullable=False, comment="标题，1-100字")
    content = Column(Text, nullable=False, comment="富文本内容")
    status = Column(String(16), default="normal", comment="状态: normal=正常, locked=锁定, hidden=隐藏, deleted=软删")
    view_count = Column(Integer, default=0, comment="浏览次数")
    like_count = Column(Integer, default=0, comment="点赞数")
    favorite_count = Column(Integer, default=0, comment="收藏数")
    reply_count = Column(Integer, default=0, comment="回复数")
    is_pinned = Column(SmallInteger, default=0, comment="是否置顶: 0=否, 1=是")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
    deleted_at = Column(DateTime, nullable=True, comment="软删除时间")

    # 关系
    author = relationship("User", backref="posts")
    section = relationship("Section", backref="posts")

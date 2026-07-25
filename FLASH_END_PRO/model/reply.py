from datetime import datetime
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from db.db import Base


class Reply(Base):
    """回复表"""
    __tablename__ = "replies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, comment="所属帖子ID")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, comment="回复用户ID")
    parent_id = Column(Integer, ForeignKey("replies.id"), nullable=True, comment="父回复ID（楼中楼）")
    content = Column(Text, nullable=False, comment="回复内容")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    deleted_at = Column(DateTime, nullable=True, comment="软删除时间")

    # 关系
    post = relationship("Post", backref="replies")
    author = relationship("User", backref="replies")
    parent = relationship("Reply", remote_side=[id], backref="children")

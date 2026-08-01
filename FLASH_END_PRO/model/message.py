"""
站内信 / 通知模型

消息类型:
- system_notice  系统通知（全站公告、系统维护）
- private_message 用户私信（用户之间一对一）
- interaction    互动通知（点赞、回复、关注）
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, SmallInteger
from sqlalchemy.orm import relationship
from db.db import Base


class Message(Base):
    """站内信"""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, comment="发送者ID（系统通知为空）")
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, comment="接收者ID")
    type = Column(String(20), nullable=False, default="system_notice", comment="消息类型: system_notice 系统通知 / private_message 用户私信 / interaction 互动通知")
    title = Column(String(100), nullable=False, default="", comment="消息标题")
    content = Column(Text, nullable=False, comment="消息内容")
    related_type = Column(String(20), nullable=True, comment="互动相关类型: like 点赞 / reply 回复 / follow 关注")
    related_id = Column(Integer, nullable=True, comment="关联数据ID（如帖子ID）")
    is_read = Column(SmallInteger, default=0, comment="0=未读, 1=已读")
    created_at = Column(DateTime, default=datetime.now, nullable=False, index=True)

    sender = relationship("User", foreign_keys=[sender_id], backref="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="received_messages")

from db import Base
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
import datetime

class User(Base):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True)
    username = Column(String(128), unique=True, index=True)
    password_hash = Column(String(256))
    created_at = Column(Date, default=datetime.date.today)
    # Extended profile fields (nullable for backward compatibility)
    # NOTE: SQLAlchemy create_all skips existing tables, so these columns won't be
    # added automatically to an existing database.
    # Dev: delete the DB file and restart. Prod: run ALTER TABLE manually.
    nickname = Column(String(64), nullable=True)
    email = Column(String(128), nullable=True)
    phone = Column(String(32), nullable=True)
    avatar = Column(String(512), nullable=True)
    bio = Column(Text, nullable=True)
    theme = Column(String(16), default="light")
    language = Column(String(16), default="zh-CN")
    email_notification = Column(Integer, default=1)
    sms_notification = Column(Integer, default=0)
    system_notification = Column(Integer, default=1)
    profile_public = Column(Integer, default=1)
    show_email = Column(Integer, default=0)
    show_phone = Column(Integer, default=0)
    allow_search = Column(Integer, default=1)
    # Role field: "user" (default) or "staff". If adding to an existing DB, run:
    # ALTER TABLE user ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'user';
    role = Column(String(32), default="user", nullable=False)




class Menu(Base):
    __tablename__ = "menu"
    id = Column(Integer, primary_key=True)
    title = Column(String(64))
    path = Column(String(128), nullable=True)
    url = Column(String(256), nullable=True)


class TicketHistory(Base):
    """工单状态变更历史"""
    __tablename__ = "ticket_history"
    id = Column(Integer, primary_key=True)
    ticket_id = Column(Integer, ForeignKey("ticket.id"), nullable=False)   # 所属工单
    old_status = Column(String(32), nullable=False)   # 变更前状态
    new_status = Column(String(32), nullable=False)   # 变更后状态
    operator = Column(String(128), nullable=True)     # 操作人用户名（记录时快照）
    changed_at = Column(Date, default=datetime.date.today)  # 变更日期

    ticket = relationship("Ticket", back_populates="history")

class TicketReply(Base):
    """工单回复模型"""
    __tablename__ = "ticket_reply"
    id = Column(Integer, primary_key=True)
    ticket_id = Column(Integer, ForeignKey("ticket.id", ondelete="CASCADE"), nullable=False)  # 所属工单
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)  # 回复人
    content = Column(Text, nullable=False)  # 回复内容
    created_at = Column(Date, default=datetime.date.today)  # 创建时间
    ticket = relationship("Ticket", back_populates="replies")
    user = relationship("User", foreign_keys=[user_id])

class QuickReply(Base):
    """快速回复模型"""
    __tablename__ = "quick_reply"
    id = Column(Integer, primary_key=True)
    title = Column(String(256), nullable=False)  # 快速回复标题
    content = Column(Text, nullable=False)  # 快速回复内容
    category = Column(String(64))  # 快速回复分类
    use_count = Column(Integer, default=0)  # 使用次数
    created_at = Column(Date, default=datetime.date.today)  # 创建时间
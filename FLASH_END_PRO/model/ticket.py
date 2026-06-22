from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
import datetime

class ticket():
    """工单模型"""
    __tablename__ = "ticket"
    id = Column(Integer, primary_key=True)
    title = Column(String(256), nullable=False)  # 工单标题
    description = Column(Text)  # 工单描述
    category = Column(String(64))  # 工单分类
    priority = Column(String(32), default="medium")  # 优先级：low, medium, high, urgent
    status = Column(String(32), default="open")  # 状态：open, in_progress, resolved, closed
    created_at = Column(Date, default=datetime.date.today)  # 创建时间
    updated_at = Column(Date, default=datetime.date.today, onupdate=datetime.date.today)  # 更新时间
    due_date = Column(Date, nullable=True)  # 截止日期
    user_id = Column(Integer, ForeignKey("user.id"))  # 创建者
    assignee_id = Column(Integer, ForeignKey("user.id"), nullable=True)  # 处理人
    first_response_at = Column(DateTime, nullable=True)  # 首次回复时间
    completed_at = Column(DateTime, nullable=True)  # 完成时间
    user = relationship("User", foreign_keys=[user_id])
    assignee = relationship("User", foreign_keys=[assignee_id])
    replies = relationship("TicketReply", back_populates="ticket", cascade="all, delete-orphan")
    history = relationship("TicketHistory", back_populates="ticket", order_by="TicketHistory.changed_at")

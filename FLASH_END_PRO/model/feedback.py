from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, SmallInteger, DateTime
from db.db import Base


class Feedback(Base):
    """用户问题反馈"""
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True, comment="提交用户ID")
    category = Column(String(32), nullable=False, comment="反馈类型: roster_error=编制错误, suggestion=网站改进建议")
    content = Column(Text, nullable=False, comment="反馈内容")
    contact = Column(String(64), nullable=True, comment="联系方式（可选）")
    status = Column(SmallInteger, default=0, comment="状态: 0=待处理, 1=已处理, 2=已忽略")
    admin_reply = Column(Text, nullable=True, comment="管理员回复")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

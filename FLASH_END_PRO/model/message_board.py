from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, SmallInteger, DateTime
from db.db import Base


class MessageBoard(Base):
    """首页留言板：用户留言，管理员筛选后展示

    - is_displayed=1 才会出现在首页留言板栏
    - is_anonymous=1 时展示时隐藏留言人信息（显示为「匿名」）
    - content 为最终展示内容，管理员可修改；original_content 保留用户原始留言
    """
    __tablename__ = "message_board"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, index=True, comment="留言用户ID")
    content = Column(Text, nullable=False, comment="展示内容（管理员可修改）")
    original_content = Column(Text, nullable=True, comment="用户原始留言内容")
    is_displayed = Column(SmallInteger, default=0, comment="是否在留言板展示: 1=展示, 0=不展示")
    is_anonymous = Column(SmallInteger, default=0, comment="是否匿名展示: 1=匿名, 0=显示昵称")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

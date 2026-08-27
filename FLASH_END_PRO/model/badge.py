from datetime import datetime
from sqlalchemy import Column, Integer, String, SmallInteger, DateTime
from db.db import Base


class Badge(Base):
    """勋章定义"""
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(32), unique=True, nullable=False, comment="勋章代码，如 quiz_90")
    name = Column(String(32), nullable=False, comment="勋章名称")
    icon = Column(String(16), default="🏅", comment="勋章图标（emoji）")
    description = Column(String(255), nullable=True, comment="勋章描述/获取条件")
    sort_order = Column(Integer, default=0, comment="排序")
    created_at = Column(DateTime, default=datetime.now, nullable=False)


class UserBadge(Base):
    """用户获得的勋章"""
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True, comment="用户ID")
    badge_id = Column(Integer, nullable=False, index=True, comment="勋章ID")
    source = Column(String(64), nullable=True, comment="获取来源，如 基础认证90分")
    created_at = Column(DateTime, default=datetime.now, nullable=False)

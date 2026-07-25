from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, SmallInteger
from db.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(20), unique=True, nullable=False, index=True, comment="用户名，3-20位字母数字下划线")
    password_hash = Column(String(128), nullable=False, comment="bcrypt密码哈希")
    avatar = Column(String(512), nullable=True, comment="头像URL")
    status = Column(SmallInteger, default=1, comment="状态: 1=正常, 0=禁用")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

"""
管理员口令模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from db.db import Base


class AdminPassphrase(Base):
    """管理员口令表 - 存储口令的 bcrypt 哈希"""
    __tablename__ = "admin_passphrases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    passphrase_hash = Column(String(128), nullable=False, comment="bcrypt 口令哈希")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

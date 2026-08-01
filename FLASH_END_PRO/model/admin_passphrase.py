"""
管理员口令模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from db.db import Base


class AdminPassphrase(Base):
    """管理员口令表 - 存储口令的 bcrypt 哈希（多口令池）"""
    __tablename__ = "admin_passphrases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    passphrase_hash = Column(String(128), nullable=False, comment="bcrypt 口令哈希")
    use_count = Column(Integer, nullable=False, default=0, comment="已使用次数（每口令最多 5 次）")
    is_builtin = Column(Boolean, nullable=False, default=False, comment="是否初始口令（代码内置，不可删除）")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

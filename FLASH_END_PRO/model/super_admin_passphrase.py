"""
超级管理员口令模型
- 超管口令池（支持查看/增加/修改/删除，仅超级管理员可操作）
- 初始口令由代码写入：天空那道闪电
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from db.db import Base


class SuperAdminPassphrase(Base):
    """超级管理员口令表 - 存储口令的 bcrypt 哈希（多口令池）"""
    __tablename__ = "super_admin_passphrases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    passphrase_hash = Column(String(128), nullable=False, comment="bcrypt 口令哈希")
    remark = Column(String(64), nullable=True, comment="口令备注（如：主口令）")
    is_builtin = Column(Boolean, nullable=False, default=False, comment="是否初始口令（代码内置，不可删除）")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

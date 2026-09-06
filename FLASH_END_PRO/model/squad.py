"""
Squad 编制数据覆盖表（超级管理员后台维护）
- 单行记录（id=1）：超管保存的阵营/载具数据以 JSON 形式存储
- enabled=1 时前端 Squad 系列页面使用本表数据；enabled=0 时回退前端静态数据
"""
from datetime import datetime

from sqlalchemy import Column, Integer, SmallInteger, DateTime
from sqlalchemy.dialects.mysql import LONGTEXT

from db.db import Base


class SquadConfig(Base):
    """Squad 编制数据覆盖（全局唯一行）"""
    __tablename__ = "squad_config"

    id = Column(Integer, primary_key=True, autoincrement=True)
    enabled = Column(SmallInteger, nullable=False, default=0, comment="1=启用数据库覆盖, 0=使用前端静态数据")
    data = Column(LONGTEXT, nullable=True, comment="FACTIONS JSON（与前端 factions.js 结构一致）")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

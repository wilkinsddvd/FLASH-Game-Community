from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from db.db import Base


class Section(Base):
    """论坛板块表"""
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(64), nullable=False, comment="板块名称")
    description = Column(String(255), nullable=True, comment="板块描述")
    sort_order = Column(Integer, default=0, comment="排序")
    created_at = Column(DateTime, default=datetime.now, nullable=False)

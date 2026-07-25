from datetime import datetime
from sqlalchemy import Column, Integer, String, SmallInteger, DateTime
from db.db import Base


class Banner(Base):
    """首页Banner轮播表"""
    __tablename__ = "banners"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(128), nullable=False, comment="Banner标题")
    image_url = Column(String(512), nullable=False, comment="图片URL")
    link_url = Column(String(512), nullable=True, comment="跳转链接")
    sort_order = Column(Integer, default=0, comment="排序（升序）")
    status = Column(SmallInteger, default=1, comment="状态: 1=显示, 0=隐藏")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

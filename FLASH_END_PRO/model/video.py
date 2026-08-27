from datetime import datetime
from sqlalchemy import Column, Integer, String, SmallInteger, DateTime
from db.db import Base


class BiliVideo(Base):
    """首页攻略栏 B站视频（管理员选择展示）"""
    __tablename__ = "bili_videos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(128), nullable=False, comment="视频标题")
    bvid = Column(String(32), nullable=False, comment="B站 BV 号，如 BV1xx411c7mD")
    cover_url = Column(String(512), nullable=True, comment="封面图URL")
    sort_order = Column(Integer, default=0, comment="排序（升序）")
    status = Column(SmallInteger, default=1, comment="状态: 1=展示, 0=隐藏")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

from datetime import datetime
from sqlalchemy import Column, Integer, DateTime
from db.db import Base


class SiteLike(Base):
    """站点点赞计数（全局唯一行 id=1）

    用于首页「反馈」栏的点赞按钮：记录并展示累计点赞次数。
    """
    __tablename__ = "site_likes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    count = Column(Integer, nullable=False, default=0, comment="累计点赞次数")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

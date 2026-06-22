from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
import datetime


class Post():
    __tablename__ = "post"
    id = Column(Integer, primary_key=True)
    title = Column(String(256))
    summary = Column(String(512))
    content = Column(Text)
    category_id = Column(Integer, ForeignKey("category.id"))
    category = relationship("Category", back_populates="posts")
    tags = relationship("Tag", secondary=post_tag, back_populates="posts")
    date = Column(Date, default=datetime.date.today)
    author_id = Column(Integer, ForeignKey("user.id"))
    author = relationship("User")
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)

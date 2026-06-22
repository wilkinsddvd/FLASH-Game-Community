from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
import datetime

class category():
    __tablename__ = "category"
    id = Column(Integer, primary_key=True)
    name = Column(String(64), unique=True)
    posts = relationship("Post", back_populates="category")

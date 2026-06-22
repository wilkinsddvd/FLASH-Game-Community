from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
import datetime

class SiteInfo():
    __tablename__ = "siteinfo"
    id = Column(Integer, primary_key=True)
    title = Column(String(128))
    description = Column(String(512))
    icp = Column(String(64))
    footer = Column(String(256))

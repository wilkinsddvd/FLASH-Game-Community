from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, SmallInteger, BigInteger, Date
from db.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uid = Column(BigInteger, unique=True, nullable=False, index=True, comment="对外唯一标识，8~10位数字")
    username = Column(String(20), unique=True, nullable=False, index=True, comment="用户名，3-20位字母数字下划线")
    password_hash = Column(String(128), nullable=False, comment="bcrypt密码哈希")
    avatar = Column(String(512), nullable=True, comment="头像URL")
    status = Column(SmallInteger, default=1, comment="状态: 1=正常, 0=禁用")

    # 用户信息（需求文档 v2：用户信息模块）
    nickname = Column(String(20), nullable=True, comment="显示昵称，2~20字符")
    bio = Column(String(30), nullable=True, comment="个人签名，0~30字符")
    gender = Column(SmallInteger, default=0, comment="性别: 0=保密, 1=男, 2=女")
    birthday = Column(Date, nullable=True, comment="生日")
    location = Column(String(30), nullable=True, comment="所在地（省/市）")
    space_cover = Column(String(512), nullable=True, comment="空间背景图")
    space_theme = Column(String(16), default="default", comment="空间主题: default/dark/blue")
    exp = Column(Integer, default=0, comment="经验值")
    level = Column(SmallInteger, default=1, comment="等级")
    post_count = Column(Integer, default=0, comment="发帖数")
    reply_count = Column(Integer, default=0, comment="回复数")
    like_received = Column(Integer, default=0, comment="获赞数")
    follower_count = Column(Integer, default=0, comment="粉丝数")
    following_count = Column(Integer, default=0, comment="关注数")
    nickname_updated_at = Column(DateTime, nullable=True, comment="昵称最近修改时间")
    username_updated_at = Column(DateTime, nullable=True, comment="用户名最近修改时间")

    # 邮箱注册
    email = Column(String(512), unique=True, nullable=True, comment="AES-256 加密后的邮箱地址")
    email_hash = Column(String(64), unique=True, nullable=True, index=True, comment="邮箱 SHA-256 哈希（用于查询）")
    registration_method = Column(String(16), default="normal", comment="注册方式: normal=用户名注册, email=邮箱注册")

    # 封禁（管理员设置封禁时长，封禁期内无法进行任何身份验证操作）
    banned_until = Column(DateTime, nullable=True, comment="封禁截止时间，NULL=未封禁")

    # 资料审核（头像/昵称/个性签名，审核通过后才展示）
    pending_avatar = Column(String(512), nullable=True, comment="待审核头像URL")
    pending_nickname = Column(String(20), nullable=True, comment="待审核昵称")
    pending_bio = Column(String(30), nullable=True, comment="待审核个性签名")
    pending_avatar_at = Column(DateTime, nullable=True, comment="头像提交审核时间")
    pending_nickname_at = Column(DateTime, nullable=True, comment="昵称提交审核时间")
    pending_bio_at = Column(DateTime, nullable=True, comment="签名提交审核时间")

    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

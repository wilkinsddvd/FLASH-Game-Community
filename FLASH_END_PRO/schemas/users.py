"""
用户空间 / 关注 Pydantic 模型
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class UserProfileOut(BaseModel):
    """用户公开信息（个人空间，参考 B 站）"""
    id: int
    uid: int
    username: str
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    gender: Optional[int] = 0
    birthday: Optional[date] = None
    location: Optional[str] = None
    space_cover: Optional[str] = None
    space_theme: Optional[str] = "default"
    level: int = 1
    exp: int = 0
    post_count: int = 0
    reply_count: int = 0
    like_received: int = 0
    follower_count: int = 0
    following_count: int = 0
    role: Optional[str] = None
    is_following: bool = False
    created_at: Optional[datetime] = None


class UserMeOut(BaseModel):
    """当前登录用户完整信息（含私有字段）"""
    id: int
    uid: int
    username: str
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    gender: Optional[int] = 0
    birthday: Optional[date] = None
    location: Optional[str] = None
    space_cover: Optional[str] = None
    space_theme: Optional[str] = "default"
    level: int = 1
    exp: int = 0
    post_count: int = 0
    reply_count: int = 0
    like_received: int = 0
    follower_count: int = 0
    following_count: int = 0
    role: Optional[str] = None
    nickname_can_change_at: Optional[datetime] = None
    registration_method: Optional[str] = "normal"
    banned_until: Optional[datetime] = None
    # 待审核资料
    pending_avatar: Optional[str] = None
    pending_nickname: Optional[str] = None
    pending_bio: Optional[str] = None
    pending_avatar_at: Optional[datetime] = None
    pending_nickname_at: Optional[datetime] = None
    pending_bio_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class LevelOut(BaseModel):
    """等级信息"""
    level: int
    current_exp: int
    next_level_exp: int
    progress_percent: float
    title: str


class FollowActionOut(BaseModel):
    """关注/取关结果"""
    is_following: bool
    follower_count: int
    following_count: int

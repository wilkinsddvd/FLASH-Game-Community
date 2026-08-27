from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    category: str = Field(..., pattern=r"^(roster_error|suggestion)$")
    content: str = Field(..., min_length=1, max_length=2000)
    contact: Optional[str] = Field(None, max_length=64)


class FeedbackReply(BaseModel):
    admin_reply: Optional[str] = Field(None, max_length=1000)
    status: Optional[int] = Field(None, ge=0, le=2)


class FeedbackOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    category: str
    content: str
    contact: Optional[str] = None
    status: int
    admin_reply: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

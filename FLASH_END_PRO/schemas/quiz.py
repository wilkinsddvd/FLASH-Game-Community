from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


# ─── QA 文档 ───

class QuizDocCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=128)
    content: str = Field(..., min_length=1)
    file_url: Optional[str] = None
    sort_order: int = 0
    status: int = Field(1, ge=0, le=1)


class QuizDocUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=128)
    content: Optional[str] = None
    file_url: Optional[str] = None
    sort_order: Optional[int] = None
    status: Optional[int] = Field(None, ge=0, le=1)


class QuizDocOut(BaseModel):
    id: int
    title: str
    content: str
    file_url: Optional[str] = None
    sort_order: int
    status: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── 题目 ───

class QuizQuestionCreate(BaseModel):
    category: str = Field("rifleman", max_length=32, description="认证分类")
    question_type: str = Field("text", max_length=16, description="题目类型: text=文字题, audio=音频题")
    audio_url: Optional[str] = Field(None, max_length=512, description="音频地址（音频题必填）")
    question: str = Field(..., min_length=1)
    option_a: str = Field(..., min_length=1)
    option_b: str = Field(..., min_length=1)
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: str = Field(..., pattern=r"^[A-Da-d]$")
    score: int = Field(5, ge=1, le=100)
    sort_order: int = 0
    status: int = Field(1, ge=0, le=1)

    @field_validator("question_type")
    @classmethod
    def _norm_type(cls, v: str) -> str:
        v = (v or "text").strip().lower()
        if v not in ("text", "audio"):
            raise ValueError("question_type 必须是 text 或 audio")
        return v

    @model_validator(mode="after")
    def _check_audio(self):
        if self.question_type == "audio" and not self.audio_url:
            raise ValueError("音频题必须上传音频文件")
        if self.question_type == "text":
            self.audio_url = None
        return self


class QuizQuestionUpdate(BaseModel):
    category: Optional[str] = Field(None, max_length=32)
    question_type: Optional[str] = Field(None, max_length=16)
    audio_url: Optional[str] = Field(None, max_length=512)
    question: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = Field(None, pattern=r"^[A-Da-d]$")
    score: Optional[int] = Field(None, ge=1, le=100)
    sort_order: Optional[int] = None
    status: Optional[int] = Field(None, ge=0, le=1)

    @field_validator("question_type")
    @classmethod
    def _norm_type(cls, v):
        if v is None:
            return v
        v = str(v).strip().lower()
        if v not in ("text", "audio"):
            raise ValueError("question_type 必须是 text 或 audio")
        return v


class QuizQuestionOut(BaseModel):
    """答题时返回的题目（不含正确答案）"""
    id: int
    category: str
    question_type: str = "text"
    audio_url: Optional[str] = None
    question: str
    option_a: str
    option_b: str
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    score: int
    sort_order: int

    class Config:
        from_attributes = True


class QuizQuestionAdminOut(QuizQuestionOut):
    """管理端题目（含正确答案）"""
    correct_answer: str
    status: int


# ─── 认证分类 ───

class QuizCategoryOut(BaseModel):
    """认证分类信息"""
    code: str
    name: str
    description: str = ""
    question_count: int = 0


# ─── 答题 ───

class QuizSubmit(BaseModel):
    category: str = Field("rifleman", max_length=32, description="认证分类")
    answers: dict = Field(..., description="答案映射 {question_id: 'A'}")


class QuizRecordOut(BaseModel):
    id: int
    category: str
    score: int
    total: int
    passed: int
    created_at: datetime

    class Config:
        from_attributes = True


class QuizSubmitResult(BaseModel):
    score: int
    total: int
    passed: bool
    correct_count: int
    question_count: int
    record: QuizRecordOut
    badge_earned: Optional[dict] = None


class QuizAnswerDetail(BaseModel):
    """答题情况页 - 单题明细（题目 + 选项 + 我的答案 + 正确答案 + 对错）"""
    question_id: int
    question_type: str = "text"
    audio_url: Optional[str] = None
    question: str
    option_a: str
    option_b: str
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    score: int
    user_answer: str = ""
    correct_answer: str = ""
    is_correct: bool = False


class QuizRecordDetail(BaseModel):
    """答题情况页 - 完整答题记录（全部题目和对应答案）"""
    id: int
    category: str
    score: int
    total: int
    passed: int
    created_at: datetime
    answers: List[QuizAnswerDetail] = []
    badge: Optional[dict] = None

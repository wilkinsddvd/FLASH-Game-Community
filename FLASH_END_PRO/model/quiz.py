from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, SmallInteger, DateTime
from db.db import Base


class QuizDoc(Base):
    """基础认证 QA 文档（管理员上传，用户答题前可查看学习）"""
    __tablename__ = "quiz_docs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(128), nullable=False, comment="文档标题")
    content = Column(Text, nullable=False, comment="文档内容（Markdown/文本）")
    file_url = Column(String(512), nullable=True, comment="附件URL（可选）")
    sort_order = Column(Integer, default=0, comment="排序（升序）")
    status = Column(SmallInteger, default=1, comment="状态: 1=显示, 0=隐藏")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)


class QuizQuestion(Base):
    """基础认证题目"""
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question = Column(Text, nullable=False, comment="题干")
    option_a = Column(String(255), nullable=False, comment="选项A")
    option_b = Column(String(255), nullable=False, comment="选项B")
    option_c = Column(String(255), nullable=True, comment="选项C")
    option_d = Column(String(255), nullable=True, comment="选项D")
    correct_answer = Column(String(1), nullable=False, comment="正确答案: A/B/C/D")
    score = Column(Integer, default=5, comment="分值")
    sort_order = Column(Integer, default=0, comment="排序")
    status = Column(SmallInteger, default=1, comment="状态: 1=启用, 0=停用")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)


class QuizRecord(Base):
    """用户答题记录"""
    __tablename__ = "quiz_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True, comment="答题用户ID")
    score = Column(Integer, default=0, comment="得分")
    total = Column(Integer, default=0, comment="总分")
    answers = Column(Text, nullable=True, comment="答案JSON: {qid: 'A'}")
    passed = Column(SmallInteger, default=0, comment="是否达标(>=90分): 1=是, 0=否")
    created_at = Column(DateTime, default=datetime.now, nullable=False)

import os
from enum import Enum
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Boolean, Enum as SQLEnum, ForeignKey, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./flash_game_community.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class Role(str, Enum):
    admin = "admin"
    operater = "operater"
    gamer = "gamer"
    unknown = "unknown"


class ContentType(str, Enum):
    display = "display"
    guide = "guide"
    developer = "developer"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    role: Mapped[Role] = mapped_column(SQLEnum(Role), default=Role.unknown)
    posts: Mapped[list["Post"]] = relationship(back_populates="author")


class StaticContent(Base):
    __tablename__ = "static_contents"

    id: Mapped[int] = mapped_column(primary_key=True)
    content_type: Mapped[ContentType] = mapped_column(SQLEnum(ContentType), index=True)
    title: Mapped[str] = mapped_column(String(120))
    body: Mapped[str] = mapped_column(Text)


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    body: Mapped[str] = mapped_column(Text)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    is_retracted: Mapped[bool] = mapped_column(Boolean, default=False)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    author: Mapped[User] = relationship(back_populates="posts")


class UserCreate(BaseModel):
    username: str


class UserRead(BaseModel):
    id: int
    username: str
    role: Role

    model_config = ConfigDict(from_attributes=True)


class ContentWrite(BaseModel):
    title: str
    body: str


class ContentRead(BaseModel):
    id: int
    content_type: ContentType
    title: str
    body: str

    model_config = ConfigDict(from_attributes=True)


class PostWrite(BaseModel):
    title: str
    body: str


class PostRead(BaseModel):
    id: int
    title: str
    body: str
    is_pinned: bool
    is_retracted: bool
    author_id: int

    model_config = ConfigDict(from_attributes=True)


app = FastAPI(title="FLASH Game Community API")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_admin(db: Session) -> None:
    admin = db.query(User).filter(User.role == Role.admin).first()
    if not admin:
        db.add(User(username="admin", role=Role.admin))
        db.commit()


def require_user(db: Session, x_user_id: Optional[int]) -> User:
    if x_user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    user = db.get(User, x_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def require_role(user: User, allowed_roles: set[Role]) -> None:
    if user.role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_admin(db)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(username=payload.username, role=Role.unknown)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.get("/api/users", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db), x_user_id: Optional[int] = Header(default=None)):
    actor = require_user(db, x_user_id)
    require_role(actor, {Role.admin, Role.operater})
    return db.query(User).all()


@app.post("/api/users/{user_id}/promote-to-gamer", response_model=UserRead)
def promote_unknown_to_gamer(
    user_id: int,
    confirmed: bool = False,
    db: Session = Depends(get_db),
    x_user_id: Optional[int] = Header(default=None),
):
    actor = require_user(db, x_user_id)
    require_role(actor, {Role.admin, Role.operater})
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target.role != Role.unknown:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only unknown can be promoted")
    if actor.role == Role.admin and not confirmed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin promotion requires confirmation")
    target.role = Role.gamer
    db.commit()
    db.refresh(target)
    return target


@app.post("/api/users/{user_id}/appoint-operator", response_model=UserRead)
def appoint_operator(user_id: int, db: Session = Depends(get_db), x_user_id: Optional[int] = Header(default=None)):
    actor = require_user(db, x_user_id)
    require_role(actor, {Role.admin})
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target.role == Role.admin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change admin role")
    target.role = Role.operater
    db.commit()
    db.refresh(target)
    return target


@app.get("/api/content/{content_type}", response_model=list[ContentRead])
def list_content(content_type: ContentType, db: Session = Depends(get_db)):
    return db.query(StaticContent).filter(StaticContent.content_type == content_type).all()


@app.post("/api/content/{content_type}", response_model=ContentRead, status_code=status.HTTP_201_CREATED)
def create_content(
    content_type: ContentType,
    payload: ContentWrite,
    db: Session = Depends(get_db),
    x_user_id: Optional[int] = Header(default=None),
):
    actor = require_user(db, x_user_id)
    require_role(actor, {Role.admin})
    record = StaticContent(content_type=content_type, title=payload.title, body=payload.body)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.put("/api/content/{content_type}/{content_id}", response_model=ContentRead)
def update_content(
    content_type: ContentType,
    content_id: int,
    payload: ContentWrite,
    db: Session = Depends(get_db),
    x_user_id: Optional[int] = Header(default=None),
):
    actor = require_user(db, x_user_id)
    require_role(actor, {Role.admin})
    record = db.get(StaticContent, content_id)
    if not record or record.content_type != content_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
    record.title = payload.title
    record.body = payload.body
    db.commit()
    db.refresh(record)
    return record


@app.delete("/api/content/{content_type}/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_content(
    content_type: ContentType,
    content_id: int,
    db: Session = Depends(get_db),
    x_user_id: Optional[int] = Header(default=None),
):
    actor = require_user(db, x_user_id)
    require_role(actor, {Role.admin})
    record = db.get(StaticContent, content_id)
    if not record or record.content_type != content_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
    db.delete(record)
    db.commit()


@app.get("/api/posts", response_model=list[PostRead])
def list_posts(db: Session = Depends(get_db)):
    return (
        db.query(Post)
        .filter(Post.is_retracted.is_(False))
        .order_by(Post.is_pinned.desc(), Post.id.desc())
        .all()
    )


@app.post("/api/posts", response_model=PostRead, status_code=status.HTTP_201_CREATED)
def create_post(payload: PostWrite, db: Session = Depends(get_db), x_user_id: Optional[int] = Header(default=None)):
    actor = require_user(db, x_user_id)
    require_role(actor, {Role.admin, Role.operater, Role.gamer})
    post = Post(title=payload.title, body=payload.body, author_id=actor.id)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@app.put("/api/posts/{post_id}", response_model=PostRead)
def update_post(post_id: int, payload: PostWrite, db: Session = Depends(get_db), x_user_id: Optional[int] = Header(default=None)):
    actor = require_user(db, x_user_id)
    require_role(actor, {Role.admin, Role.operater, Role.gamer})
    post = db.get(Post, post_id)
    if not post or post.is_retracted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if actor.role != Role.admin and post.author_id != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the author can edit")
    post.title = payload.title
    post.body = payload.body
    db.commit()
    db.refresh(post)
    return post


@app.delete("/api/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db), x_user_id: Optional[int] = Header(default=None)):
    actor = require_user(db, x_user_id)
    require_role(actor, {Role.admin, Role.operater, Role.gamer})
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if actor.role != Role.admin and post.author_id != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the author can delete")
    db.delete(post)
    db.commit()


@app.patch("/api/posts/{post_id}/pin", response_model=PostRead)
def pin_post(post_id: int, db: Session = Depends(get_db), x_user_id: Optional[int] = Header(default=None)):
    actor = require_user(db, x_user_id)
    require_role(actor, {Role.admin})
    post = db.get(Post, post_id)
    if not post or post.is_retracted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    post.is_pinned = True
    db.commit()
    db.refresh(post)
    return post


@app.patch("/api/posts/{post_id}/retract", response_model=PostRead)
def retract_post(post_id: int, db: Session = Depends(get_db), x_user_id: Optional[int] = Header(default=None)):
    actor = require_user(db, x_user_id)
    require_role(actor, {Role.admin, Role.operater})
    post = db.get(Post, post_id)
    if not post or post.is_retracted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    target_author = db.get(User, post.author_id)
    if not target_author:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author not found")
    if actor.role == Role.admin and target_author.role not in {Role.operater, Role.gamer}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin can only retract operator/gamer posts")
    if actor.role == Role.operater and target_author.role != Role.gamer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operator can only retract gamer posts")
    post.is_retracted = True
    db.commit()
    db.refresh(post)
    return post

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, delete, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.deps import get_current_user, get_current_user_optional
from db.db import get_async_db
from model.user import User
from model.section import Section
from model.post import Post
from model.reply import Reply
from model.interaction import PostLike, PostFavorite
from schemas.forum import (
    SectionCreate, SectionOut,
    PostCreate, PostUpdate, PostStatusUpdate,
    PostListItem, PostDetail,
    ReplyCreate, ReplyOut,
    InteractionResponse,
)

router = APIRouter(prefix="/api", tags=["论坛"])


# ════════════════════════════════════════
# 板块
# ════════════════════════════════════════

@router.get("/sections", response_model=List[SectionOut])
async def list_sections(db: AsyncSession = Depends(get_async_db)):
    """获取板块列表"""
    result = await db.execute(select(Section).order_by(Section.sort_order, Section.id))
    return result.scalars().all()


@router.post("/sections", response_model=SectionOut, status_code=201)
async def create_section(
    req: SectionCreate,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(get_current_user),
):
    """创建板块（需要登录）"""
    section = Section(**req.model_dump())
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return section


# ════════════════════════════════════════
# 帖子
# ════════════════════════════════════════

@router.get("/sections/{section_id}/posts", response_model=List[PostListItem])
async def list_section_posts(
    section_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_async_db),
):
    """获取板块帖子列表"""
    # 检查板块是否存在
    result = await db.execute(select(Section).where(Section.id == section_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="板块不存在")

    query = (
        select(
            Post.id,
            Post.title,
            Post.user_id,
            User.username,
            Post.section_id,
            Post.status,
            Post.view_count,
            Post.like_count,
            Post.favorite_count,
            Post.reply_count,
            Post.is_pinned,
            Post.created_at,
            Post.updated_at,
        )
        .join(User, Post.user_id == User.id, isouter=True)
        .where(Post.section_id == section_id, Post.status.in_(["normal", "locked"]))
        .order_by(Post.is_pinned.desc(), Post.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        PostListItem(
            id=row.id,
            title=row.title,
            user_id=row.user_id,
            username=row.username,
            section_id=row.section_id,
            status=row.status,
            view_count=row.view_count,
            like_count=row.like_count,
            favorite_count=row.favorite_count,
            reply_count=row.reply_count,
            is_pinned=row.is_pinned,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]


@router.get("/posts/search", response_model=List[PostListItem])
async def search_posts(
    q: str = Query(..., min_length=1, max_length=100),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_async_db),
):
    """搜索帖子（MySQL 全文检索）"""
    query = (
        select(
            Post.id,
            Post.title,
            Post.user_id,
            User.username,
            Post.section_id,
            Post.status,
            Post.view_count,
            Post.like_count,
            Post.favorite_count,
            Post.reply_count,
            Post.is_pinned,
            Post.created_at,
            Post.updated_at,
        )
        .join(User, Post.user_id == User.id, isouter=True)
        .where(
            Post.status.in_(["normal", "locked"]),
            or_(
                Post.title.like(f"%{q}%"),
                Post.content.like(f"%{q}%"),
            ),
        )
        .order_by(Post.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        PostListItem(
            id=row.id,
            title=row.title,
            user_id=row.user_id,
            username=row.username,
            section_id=row.section_id,
            status=row.status,
            view_count=row.view_count,
            like_count=row.like_count,
            favorite_count=row.favorite_count,
            reply_count=row.reply_count,
            is_pinned=row.is_pinned,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]


@router.post("/posts", response_model=PostDetail, status_code=201)
async def create_post(
    req: PostCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """发帖"""
    # 检查板块
    result = await db.execute(select(Section).where(Section.id == req.section_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="板块不存在")

    post = Post(
        user_id=current_user.id,
        section_id=req.section_id,
        title=req.title,
        content=req.content,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)

    return PostDetail(
        id=post.id,
        title=post.title,
        content=post.content,
        user_id=post.user_id,
        username=current_user.username,
        section_id=post.section_id,
        status=post.status,
        view_count=post.view_count,
        like_count=post.like_count,
        favorite_count=post.favorite_count,
        reply_count=post.reply_count,
        is_pinned=post.is_pinned,
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


@router.get("/posts/{post_id}", response_model=PostDetail)
async def get_post(
    post_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """获取帖子详情"""
    query = (
        select(Post, User.username)
        .join(User, Post.user_id == User.id, isouter=True)
        .where(Post.id == post_id)
    )
    result = await db.execute(query)
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="帖子不存在")

    post, username = row.Post, row.username

    # 权限校验：隐藏/删除的帖子仅作者和管理可见
    if post.status in ("hidden", "deleted"):
        if not current_user or (current_user.id != post.user_id):
            raise HTTPException(status_code=404, detail="帖子不存在")

    # 增加浏览量
    post.view_count += 1
    await db.commit()

    return PostDetail(
        id=post.id,
        title=post.title,
        content=post.content,
        user_id=post.user_id,
        username=username,
        section_id=post.section_id,
        status=post.status,
        view_count=post.view_count,
        like_count=post.like_count,
        favorite_count=post.favorite_count,
        reply_count=post.reply_count,
        is_pinned=post.is_pinned,
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


@router.put("/posts/{post_id}", response_model=PostDetail)
async def update_post(
    post_id: int,
    req: PostUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """更新帖子（仅作者或管理员）"""
    result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="只能编辑自己的帖子")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(post, key, value)
    await db.commit()
    await db.refresh(post)

    user_result = await db.execute(select(User).where(User.id == post.user_id))
    username = user_result.scalar_one_or_none().username if user_result else None

    return PostDetail(
        id=post.id,
        title=post.title,
        content=post.content,
        user_id=post.user_id,
        username=username,
        section_id=post.section_id,
        status=post.status,
        view_count=post.view_count,
        like_count=post.like_count,
        favorite_count=post.favorite_count,
        reply_count=post.reply_count,
        is_pinned=post.is_pinned,
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


@router.delete("/posts/{post_id}", status_code=204)
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """删除帖子（软删除，仅作者）"""
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="只能删除自己的帖子")

    from datetime import datetime
    post.status = "deleted"
    post.deleted_at = datetime.now()
    await db.commit()


# ════════════════════════════════════════
# 回复
# ════════════════════════════════════════

@router.get("/posts/{post_id}/replies", response_model=List[ReplyOut])
async def list_replies(
    post_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_async_db),
):
    """获取帖子回复列表"""
    result = await db.execute(select(Post).where(Post.id == post_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="帖子不存在")

    query = (
        select(Reply, User.username)
        .join(User, Reply.user_id == User.id, isouter=True)
        .where(Reply.post_id == post_id, Reply.deleted_at.is_(None))
        .order_by(Reply.created_at)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        ReplyOut(
            id=row.Reply.id,
            post_id=row.Reply.post_id,
            user_id=row.Reply.user_id,
            username=row.username,
            parent_id=row.Reply.parent_id,
            content=row.Reply.content,
            created_at=row.Reply.created_at,
        )
        for row in rows
    ]


@router.post("/posts/{post_id}/replies", response_model=ReplyOut, status_code=201)
async def create_reply(
    post_id: int,
    req: ReplyCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """回复帖子"""
    # 检查帖子状态
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")
    if post.status == "locked":
        raise HTTPException(status_code=403, detail="帖子已锁定，无法回复")
    if post.status == "deleted":
        raise HTTPException(status_code=404, detail="帖子不存在")

    # 检查父回复
    if req.parent_id:
        result = await db.execute(
            select(Reply).where(Reply.id == req.parent_id, Reply.post_id == post_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="父回复不存在")

    reply = Reply(
        post_id=post_id,
        user_id=current_user.id,
        parent_id=req.parent_id,
        content=req.content,
    )
    db.add(reply)

    # 更新帖子回复计数
    post.reply_count += 1

    await db.commit()
    await db.refresh(reply)

    return ReplyOut(
        id=reply.id,
        post_id=reply.post_id,
        user_id=reply.user_id,
        username=current_user.username,
        parent_id=reply.parent_id,
        content=reply.content,
        created_at=reply.created_at,
    )


@router.delete("/replies/{reply_id}", status_code=204)
async def delete_reply(
    reply_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """删除回复（软删除，仅作者）"""
    result = await db.execute(select(Reply).where(Reply.id == reply_id))
    reply = result.scalar_one_or_none()
    if not reply:
        raise HTTPException(status_code=404, detail="回复不存在")
    if reply.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="只能删除自己的回复")

    from datetime import datetime
    reply.deleted_at = datetime.now()

    # 更新帖子回复计数
    post_result = await db.execute(select(Post).where(Post.id == reply.post_id))
    post = post_result.scalar_one_or_none()
    if post and post.reply_count > 0:
        post.reply_count -= 1
    await db.commit()


# ════════════════════════════════════════
# 互动（点赞/收藏）
# ════════════════════════════════════════

@router.post("/posts/{post_id}/like", response_model=InteractionResponse)
async def toggle_like(
    post_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """点赞/取消点赞"""
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")

    result = await db.execute(
        select(PostLike).where(
            PostLike.post_id == post_id,
            PostLike.user_id == current_user.id,
        )
    )
    like = result.scalar_one_or_none()

    if like:
        await db.delete(like)
        post.like_count = max(0, post.like_count - 1)
        # 更新作者获赞数
        if post.user_id:
            author_result = await db.execute(select(User).where(User.id == post.user_id))
            author = author_result.scalar_one_or_none()
            if author:
                author.like_received = max(0, (author.like_received or 0) - 1)
        await db.commit()
        return InteractionResponse(message="取消点赞", liked=False, like_count=post.like_count)

    db.add(PostLike(post_id=post_id, user_id=current_user.id))
    post.like_count += 1
    # 更新作者获赞数
    if post.user_id:
        author_result = await db.execute(select(User).where(User.id == post.user_id))
        author = author_result.scalar_one_or_none()
        if author:
            author.like_received = (author.like_received or 0) + 1
    await db.commit()
    return InteractionResponse(message="点赞成功", liked=True, like_count=post.like_count)


@router.post("/posts/{post_id}/favorite", response_model=InteractionResponse)
async def toggle_favorite(
    post_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """收藏/取消收藏"""
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")

    result = await db.execute(
        select(PostFavorite).where(
            PostFavorite.post_id == post_id,
            PostFavorite.user_id == current_user.id,
        )
    )
    fav = result.scalar_one_or_none()

    if fav:
        await db.delete(fav)
        post.favorite_count = max(0, post.favorite_count - 1)
        await db.commit()
        return InteractionResponse(message="取消收藏", favorited=False, favorite_count=post.favorite_count)

    db.add(PostFavorite(post_id=post_id, user_id=current_user.id))
    post.favorite_count += 1
    await db.commit()
    return InteractionResponse(message="收藏成功", favorited=True, favorite_count=post.favorite_count)

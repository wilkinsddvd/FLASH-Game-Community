from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.deps import get_current_user, get_current_user_optional, require_permissions, require_super_admin
from db.db import get_async_db
from model.user import User
from model.banner import Banner
from model.article import Article
from model.cms import CmsPage
from schemas.cms import (
    BannerCreate, BannerUpdate, BannerOut,
    ArticleCreate, ArticleUpdate, ArticleListItem, ArticleDetail,
    CmsPageCreate, CmsPageUpdate, CmsPageOut,
)

router = APIRouter(tags=["内容管理"])


# ════════════════════════════════════════
# Banner - 公开接口
# ════════════════════════════════════════

@router.get("/api/banners", response_model=List[BannerOut])
async def list_active_banners(db: AsyncSession = Depends(get_async_db)):
    """获取启用的Banner列表（公开）"""
    result = await db.execute(
        select(Banner)
        .where(Banner.status == 1)
        .order_by(Banner.sort_order, Banner.id)
    )
    return result.scalars().all()


@router.get("/api/admin/banners", response_model=List[BannerOut])
async def list_all_banners(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """获取所有Banner列表（管理后台）"""
    result = await db.execute(
        select(Banner).order_by(Banner.sort_order, Banner.id)
    )
    return result.scalars().all()


@router.post("/api/admin/banners", response_model=BannerOut, status_code=201)
async def create_banner(
    req: BannerCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """创建Banner（管理后台）"""
    banner = Banner(**req.model_dump())
    db.add(banner)
    await db.commit()
    await db.refresh(banner)
    return banner


@router.put("/api/admin/banners/{banner_id}", response_model=BannerOut)
async def update_banner(
    banner_id: int,
    req: BannerUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """更新Banner"""
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner不存在")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(banner, key, value)
    await db.commit()
    await db.refresh(banner)
    return banner


@router.delete("/api/admin/banners/{banner_id}", status_code=204)
async def delete_banner(
    banner_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """删除Banner"""
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner不存在")
    await db.delete(banner)
    await db.commit()


# ════════════════════════════════════════
# 文章 - 公开接口
# ════════════════════════════════════════

@router.get("/api/articles", response_model=List[ArticleListItem])
async def list_articles(
    category: Optional[str] = Query(None, pattern=r"^(news|guide|developer)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_async_db),
):
    """获取文章列表（公开，仅已发布）"""
    query = (
        select(Article, User.username)
        .join(User, Article.author_id == User.id, isouter=True)
        .where(Article.status == "published")
    )

    if category:
        query = query.where(Article.category == category)

    query = query.order_by(Article.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    rows = result.all()

    return [
        ArticleListItem(
            id=row.Article.id,
            category=row.Article.category,
            title=row.Article.title,
            summary=row.Article.summary,
            cover_image=row.Article.cover_image,
            author_id=row.Article.author_id,
            author_name=row.username,
            view_count=row.Article.view_count,
            status=row.Article.status,
            created_at=row.Article.created_at,
        )
        for row in rows
    ]


@router.get("/api/articles/{article_id}", response_model=ArticleDetail)
async def get_article(
    article_id: int,
    db: AsyncSession = Depends(get_async_db),
):
    """获取文章详情（公开）"""
    query = (
        select(Article, User.username)
        .join(User, Article.author_id == User.id, isouter=True)
        .where(Article.id == article_id, Article.status == "published")
    )
    result = await db.execute(query)
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="文章不存在")

    # 增加浏览量
    row.Article.view_count += 1
    await db.commit()

    return ArticleDetail(
        id=row.Article.id,
        category=row.Article.category,
        title=row.Article.title,
        summary=row.Article.summary,
        content=row.Article.content,
        cover_image=row.Article.cover_image,
        author_id=row.Article.author_id,
        author_name=row.username,
        view_count=row.Article.view_count,
        status=row.Article.status,
        created_at=row.Article.created_at,
        updated_at=row.Article.updated_at,
    )


# ─── 文章 - 管理后台（仅超级管理员，且仅可管理 SQUAD闪电谈(developer) 栏下的文章） ───

ARTICLE_MANAGE_CATEGORY = "developer"  # SQUAD闪电谈


@router.get("/api/admin/articles/{article_id}", response_model=ArticleDetail)
async def get_admin_article(
    article_id: int,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_super_admin),
):
    """获取文章详情（超管后台，仅 SQUAD闪电谈 栏）"""
    query = (
        select(Article, User.username)
        .join(User, Article.author_id == User.id, isouter=True)
        .where(Article.id == article_id, Article.category == ARTICLE_MANAGE_CATEGORY)
    )
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="文章不存在或不在可管理栏目下")

    return ArticleDetail(
        id=row.Article.id,
        category=row.Article.category,
        title=row.Article.title,
        summary=row.Article.summary,
        content=row.Article.content,
        cover_image=row.Article.cover_image,
        author_id=row.Article.author_id,
        author_name=row.username,
        view_count=row.Article.view_count,
        status=row.Article.status,
        created_at=row.Article.created_at,
        updated_at=row.Article.updated_at,
    )


@router.get("/api/admin/articles", response_model=List[ArticleListItem])
async def list_all_articles(
    status: Optional[str] = Query(None, pattern=r"^(published|draft)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_super_admin),
):
    """获取文章列表（超管后台，仅 SQUAD闪电谈 栏）"""
    query = (
        select(Article, User.username)
        .join(User, Article.author_id == User.id, isouter=True)
        .where(Article.category == ARTICLE_MANAGE_CATEGORY)
    )
    if status:
        query = query.where(Article.status == status)

    query = query.order_by(Article.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    rows = result.all()

    return [
        ArticleListItem(
            id=row.Article.id,
            category=row.Article.category,
            title=row.Article.title,
            summary=row.Article.summary,
            cover_image=row.Article.cover_image,
            author_id=row.Article.author_id,
            author_name=row.username,
            view_count=row.Article.view_count,
            status=row.Article.status,
            created_at=row.Article.created_at,
        )
        for row in rows
    ]


@router.post("/api/admin/articles", response_model=ArticleDetail, status_code=201)
async def create_article(
    req: ArticleCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_super_admin),
):
    """创建文章（固定 SQUAD闪电谈 栏目）"""
    data = req.model_dump()
    data["category"] = ARTICLE_MANAGE_CATEGORY  # 只能发布到 SQUAD闪电谈
    article = Article(
        **data,
        author_id=current_user.id,
    )
    db.add(article)
    await db.commit()
    await db.refresh(article)

    return ArticleDetail(
        id=article.id,
        category=article.category,
        title=article.title,
        summary=article.summary,
        content=article.content,
        cover_image=article.cover_image,
        author_id=article.author_id,
        author_name=current_user.username,
        view_count=article.view_count,
        status=article.status,
        created_at=article.created_at,
        updated_at=article.updated_at,
    )


@router.put("/api/admin/articles/{article_id}", response_model=ArticleDetail)
async def update_article(
    article_id: int,
    req: ArticleUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_super_admin),
):
    """更新文章（仅 SQUAD闪电谈 栏，不允许改栏目）"""
    result = await db.execute(
        select(Article).where(Article.id == article_id, Article.category == ARTICLE_MANAGE_CATEGORY)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在或不在可管理栏目下")

    update_data = req.model_dump(exclude_unset=True)
    update_data.pop("category", None)  # 栏目不可修改
    for key, value in update_data.items():
        setattr(article, key, value)
    await db.commit()
    await db.refresh(article)

    user_result = await db.execute(select(User).where(User.id == article.author_id))
    author = user_result.scalar_one_or_none()

    return ArticleDetail(
        id=article.id,
        category=article.category,
        title=article.title,
        summary=article.summary,
        content=article.content,
        cover_image=article.cover_image,
        author_id=article.author_id,
        author_name=author.username if author else None,
        view_count=article.view_count,
        status=article.status,
        created_at=article.created_at,
        updated_at=article.updated_at,
    )


@router.delete("/api/admin/articles/{article_id}", status_code=204)
async def delete_article(
    article_id: int,
    db: AsyncSession = Depends(get_async_db),
    _=Depends(require_super_admin),
):
    """删除文章（仅 SQUAD闪电谈 栏）"""
    result = await db.execute(
        select(Article).where(Article.id == article_id, Article.category == ARTICLE_MANAGE_CATEGORY)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在或不在可管理栏目下")
    await db.delete(article)
    await db.commit()


# ════════════════════════════════════════
# CMS 静态页面 - 公开接口
# ════════════════════════════════════════

@router.get("/api/pages/{slug}", response_model=CmsPageOut)
async def get_cms_page(
    slug: str,
    db: AsyncSession = Depends(get_async_db),
):
    """获取CMS页面（公开）"""
    result = await db.execute(
        select(CmsPage).where(CmsPage.slug == slug, CmsPage.status == "published")
    )
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="页面不存在")
    return page


# ─── CMS 页面 - 管理后台 ───

@router.get("/api/admin/pages", response_model=List[CmsPageOut])
async def list_cms_pages(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """获取所有CMS页面（管理后台）"""
    result = await db.execute(select(CmsPage).order_by(CmsPage.id))
    return result.scalars().all()


@router.post("/api/admin/pages", response_model=CmsPageOut, status_code=201)
async def create_cms_page(
    req: CmsPageCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """创建CMS页面"""
    result = await db.execute(select(CmsPage).where(CmsPage.slug == req.slug))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="slug已存在")

    page = CmsPage(**req.model_dump())
    db.add(page)
    await db.commit()
    await db.refresh(page)
    return page


@router.put("/api/admin/pages/{page_id}", response_model=CmsPageOut)
async def update_cms_page(
    page_id: int,
    req: CmsPageUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """更新CMS页面"""
    result = await db.execute(select(CmsPage).where(CmsPage.id == page_id))
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="页面不存在")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(page, key, value)
    await db.commit()
    await db.refresh(page)
    return page


@router.delete("/api/admin/pages/{page_id}", status_code=204)
async def delete_cms_page(
    page_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """删除CMS页面"""
    result = await db.execute(select(CmsPage).where(CmsPage.id == page_id))
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="页面不存在")
    await db.delete(page)
    await db.commit()

"""
微信登录 —— 接口预留（尚未接入）

现状：仅预留路由与数据表，未配置 AppID/AppSecret 时统一返回 503。
接入时需要（供后续实现参考）：
1. 微信开放平台「网站应用」申请 AppID + AppSecret，配置授权回调域名
2. 前端跳转 authorize-url → 用户授权 → 微信带 code 回调 redirect_uri
3. 后端用 code 调 https://api.weixin.qq.com/sns/oauth2/access_token 换 openid/unionid
4. 按 (provider, openid) 查 user_oauth：
   - 已绑定 → 直接下发本站 JWT
   - 未绑定 → 新建用户（默认用户名「微信用户-00001」，由发号器生成，可后续改名）并绑定
5. 安全：state 防 CSRF、AppSecret 只存服务端、openid 不对外暴露
"""
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user
from core.config import settings
from db.db import get_async_db
from model.oauth import UserOauth
from model.user import User
from schemas.oauth import OauthBindingOut, OauthBindIn, WechatAuthorizeUrlOut, WechatCallbackIn

router = APIRouter(prefix="/api/auth/wechat", tags=["微信登录（预留）"])

WECHAT_QRCONNECT = "https://open.weixin.qq.com/connect/qrconnect"
STATE_CACHE_PREFIX = "wechat_oauth_state:"
STATE_TTL = 600  # 10 分钟


def _wechat_configured() -> bool:
    return bool(settings.wechat_appid and settings.wechat_appsecret and settings.wechat_redirect_uri)


def _not_configured() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="微信登录尚未启用（未配置 WECHAT_APPID / WECHAT_APPSECRET / WECHAT_REDIRECT_URI）",
    )


@router.get("/authorize-url", response_model=WechatAuthorizeUrlOut)
async def get_authorize_url():
    """返回微信授权跳转地址（前端「微信登录」按钮用）"""
    if not _wechat_configured():
        raise _not_configured()
    state = secrets.token_urlsafe(16)
    # state 落 Redis，回调时校验（Redis 不可用也不阻塞，仅降级）
    try:
        from core.redis import redis_client
        r = await redis_client.connect()
        await r.set(f"{STATE_CACHE_PREFIX}{state}", "1", ex=STATE_TTL)
    except Exception:  # noqa: BLE001
        pass
    from urllib.parse import quote
    url = (
        f"{WECHAT_QRCONNECT}?appid={settings.wechat_appid}"
        f"&redirect_uri={quote(settings.wechat_redirect_uri, safe='')}"
        f"&response_type=code&scope=snsapi_login&state={state}#wechat_redirect"
    )
    return WechatAuthorizeUrlOut(url=url, state=state)


@router.post("/callback")
async def wechat_callback(body: WechatCallbackIn):  # noqa: ARG001
    """微信授权回调：换 openid → 查/建用户 → 下发本站 JWT（待实现）"""
    if not _wechat_configured():
        raise _not_configured()
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="微信登录回调逻辑尚未实现（接口已预留）",
    )


@router.get("/bindings", response_model=list[OauthBindingOut])
async def list_bindings(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """查看当前用户已绑定的第三方账号（不含 openid 明文）"""
    result = await db.execute(select(UserOauth).where(UserOauth.user_id == current_user.id))
    rows = result.scalars().all()
    return [
        OauthBindingOut(
            id=r.id,
            provider=r.provider,
            nickname=r.nickname,
            avatar_url=r.avatar_url,
            bound_at=r.created_at,
        )
        for r in rows
    ]


@router.post("/bind")
async def bind_wechat(body: OauthBindIn):  # noqa: ARG001
    """把微信账号绑定到当前登录用户（待实现）"""
    if not _wechat_configured():
        raise _not_configured()
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="微信绑定逻辑尚未实现（接口已预留）",
    )


@router.post("/unbind")
async def unbind_wechat(
    provider: str = "wechat",
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
):
    """解绑第三方账号"""
    result = await db.execute(
        select(UserOauth).where(
            UserOauth.user_id == current_user.id,
            UserOauth.provider == provider,
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="未绑定该第三方账号")
    await db.delete(row)
    await db.commit()
    return {"message": "已解绑"}

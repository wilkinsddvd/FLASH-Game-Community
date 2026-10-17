"""文章封面本地化

外部图片 URL 在浏览器里直接引用会有三个问题：
1. 第三方 CDN 可能开启防盗链、限速或随时失效；
2. 图片往往是原图（几 MB），首页列表加载慢；
3. 换域名/上 HTTPS 时容易出现混合内容。

这里把外链封面下载到本地上传目录，统一转成 WebP 并限制最大宽度，
数据库里只存 `/uploads/covers/xxx.webp` 这种同源相对路径。
"""
import hashlib
import io
import ipaddress
import os
import socket
import urllib.request
from urllib.parse import urlparse

from PIL import Image

from core.config import settings

MAX_BYTES = 8 * 1024 * 1024  # 8MB
MAX_WIDTH = 1280
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)


def _covers_dir() -> str:
    path = os.path.join(settings.upload_dir, "covers")
    os.makedirs(path, exist_ok=True)
    return path


def _assert_public_url(url: str) -> None:
    """只允许公网 http(s) 地址，避免 SSRF 访问内网/本机。"""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("封面地址必须是 http(s)")
    host = parsed.hostname
    if not host:
        raise ValueError("封面地址缺少主机名")
    for info in socket.getaddrinfo(host, None):
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            raise ValueError("封面地址不允许指向内网/本机")


def localize_cover(url: str) -> str:
    """把外部封面下载并转为本地 WebP；失败时原样返回（不阻断文章保存）。"""
    url = (url or "").strip()
    if not url:
        return url
    if url.startswith("/uploads/") or url.startswith("uploads/"):
        return url if url.startswith("/") else f"/{url}"
    if not url.lower().startswith(("http://", "https://")):
        return url

    _assert_public_url(url)

    key = hashlib.sha1(url.encode("utf-8")).hexdigest()[:16]
    filename = f"{key}.webp"
    out_path = os.path.join(_covers_dir(), filename)
    public_path = f"/uploads/covers/{filename}"

    if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
        return public_path

    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "image/*,*/*;q=0.8"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        content_type = (resp.headers.get("Content-Type") or "").lower()
        if not content_type.startswith("image/"):
            raise ValueError(f"封面不是图片: {content_type or 'unknown'}")
        data = resp.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError("封面图超过 8MB")

    with Image.open(io.BytesIO(data)) as img:
        img.load()
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            rgba = img.convert("RGBA")
            background = Image.new("RGB", rgba.size, (255, 255, 255))
            background.paste(rgba, mask=rgba.split()[-1])
            img = background
        else:
            img = img.convert("RGB")
        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / float(img.width)
            img = img.resize((MAX_WIDTH, max(1, int(img.height * ratio))), Image.LANCZOS)
        img.save(out_path, "WEBP", quality=82, method=6)

    return public_path

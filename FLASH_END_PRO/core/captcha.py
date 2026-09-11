"""
图片验证码
- Pillow 动态绘制（噪点 + 干扰线 + 轻微旋转）
- 答案存 Redis，带 TTL，**一次性使用**（校验后立即删除，防重放）
- 不依赖字体文件：优先用系统字体，取不到时用 Pillow 内置 Aileron（load_default(size)）
"""
import base64
import io
import random
import secrets

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from core.redis import redis_client

CAPTCHA_PREFIX = "captcha:"
CAPTCHA_TTL = 180          # 有效期（秒）
CAPTCHA_LENGTH = 4         # 字符数
CAPTCHA_WIDTH = 150
CAPTCHA_HEIGHT = 50

# 去掉易混淆字符（0/O、1/I/L、2/Z 等）
CAPTCHA_CHARS = "ABCDEFGHJKMNPQRSTUVWXY3456789"

_FONT_CANDIDATES = (
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Verdana Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",   # Debian/容器的常见路径
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
)


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in _FONT_CANDIDATES:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    try:
        return ImageFont.load_default(size=size)  # Pillow >= 10.1，内置矢量字体
    except TypeError:
        return ImageFont.load_default()


def _rand_color(low: int, high: int) -> tuple[int, int, int]:
    return (
        random.randint(low, high),
        random.randint(low, high),
        random.randint(low, high),
    )


def render_captcha(code: str) -> bytes:
    """把验证码文本绘制成 PNG 字节"""
    image = Image.new("RGB", (CAPTCHA_WIDTH, CAPTCHA_HEIGHT), _rand_color(230, 255))
    draw = ImageDraw.Draw(image)

    # 干扰线
    for _ in range(random.randint(3, 5)):
        draw.line(
            [
                (random.randint(0, CAPTCHA_WIDTH), random.randint(0, CAPTCHA_HEIGHT)),
                (random.randint(0, CAPTCHA_WIDTH), random.randint(0, CAPTCHA_HEIGHT)),
            ],
            fill=_rand_color(120, 200),
            width=random.randint(1, 2),
        )

    # 字符（逐个随机颜色/字号/上下偏移）
    step = CAPTCHA_WIDTH // (len(code) + 1)
    for index, char in enumerate(code):
        font = _load_font(random.randint(30, 36))
        x = step * (index + 1) - step // 2 + random.randint(-4, 4)
        y = random.randint(4, 12)
        draw.text((x, y), char, font=font, fill=_rand_color(20, 110))

    # 噪点
    for _ in range(random.randint(60, 110)):
        draw.point(
            (random.randint(0, CAPTCHA_WIDTH), random.randint(0, CAPTCHA_HEIGHT)),
            fill=_rand_color(120, 220),
        )

    # 轻微旋转 + 轻模糊，增加机器识别难度
    image = image.rotate(random.uniform(-4, 4), resample=Image.BICUBIC, expand=False)
    image = image.filter(ImageFilter.SMOOTH)

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def random_code() -> str:
    return "".join(secrets.choice(CAPTCHA_CHARS) for _ in range(CAPTCHA_LENGTH))


async def create_captcha() -> dict:
    """生成验证码，返回 {captcha_id, image(data URI), expires_in}"""
    code = random_code()
    captcha_id = secrets.token_urlsafe(16)

    redis = await redis_client.connect()
    await redis.set(f"{CAPTCHA_PREFIX}{captcha_id}", code, ex=CAPTCHA_TTL)

    png = render_captcha(code)
    data_uri = "data:image/png;base64," + base64.b64encode(png).decode("ascii")
    return {"captcha_id": captcha_id, "image": data_uri, "expires_in": CAPTCHA_TTL}


async def verify_captcha(captcha_id: str | None, code: str | None) -> bool:
    """校验验证码（一次性：无论对错都删除，防止暴力枚举）"""
    if not captcha_id or not code:
        return False
    key = f"{CAPTCHA_PREFIX}{captcha_id}"
    redis = await redis_client.connect()
    stored = await redis.get(key)
    if stored is None:
        return False
    await redis.delete(key)  # 一次性
    return str(stored).strip().upper() == str(code).strip().upper()


def generate() -> str:
    """同步便捷方法（仅供脚本/测试使用）"""
    return random_code()


__all__ = [
    "create_captcha",
    "verify_captcha",
    "render_captcha",
    "random_code",
    "CAPTCHA_TTL",
    "generate",
]

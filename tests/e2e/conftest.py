import os
import subprocess
import sys
import time
from pathlib import Path

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "FLASH_END_PRO"))

BASE_URL = os.getenv("E2E_BASE_URL", "http://localhost:3001").rstrip("/")
REPORTS = ROOT / "tests" / "reports"
REPORTS.mkdir(parents=True, exist_ok=True)


def find_chromium() -> str:
    env = os.getenv("CHROME_BIN")
    if env and Path(env).exists():
        return env
    cache = Path.home() / "Library/Caches/ms-playwright"
    for d in sorted(cache.glob("chromium-*"), reverse=True):
        p = d / "chrome-mac/Chromium.app/Contents/MacOS/Chromium"
        if p.exists():
            return str(p)
    for p in ("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",):
        if Path(p).exists():
            return p
    raise RuntimeError("找不到 Chromium/Chrome，可用 CHROME_BIN 指定")


def make_driver(width=1440, height=1000, mobile=False):
    opts = Options()
    opts.binary_location = find_chromium()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument(f"--window-size={width},{height}")
    opts.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    if mobile:
        opts.add_experimental_option("mobileEmulation", {"deviceMetrics": {"width": width, "height": height, "pixelRatio": 2}, "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"})
    d = webdriver.Chrome(options=opts)
    d.set_page_load_timeout(30)
    return d


@pytest.fixture()
def driver():
    d = make_driver()
    yield d
    d.quit()


@pytest.fixture()
def mobile_driver():
    d = make_driver(390, 844, mobile=True)
    yield d
    d.quit()


def _token_via_subprocess():
    code = r"""
import asyncio, sys
sys.path.insert(0, ".")
from sqlalchemy import select
from db.db import async_session
from model.user import User
from model.role import Role, user_roles
from core.security import create_access_token

async def main():
    async with async_session() as db:
        res = await db.execute(
            select(User).join(user_roles, user_roles.c.user_id == User.id)
            .join(Role, Role.id == user_roles.c.role_id)
            .where(Role.code == "super_admin", User.status != 0).limit(1)
        )
        u = res.scalars().first()
        print(create_access_token({"sub": str(u.id)}) if u else "")

asyncio.run(main())
"""
    r = subprocess.run(
        [sys.executable, "-c", code],
        cwd=ROOT / "FLASH_END_PRO",
        capture_output=True,
        text=True,
        timeout=20,
    )
    lines = [x.strip() for x in r.stdout.splitlines() if x.strip()]
    return lines[-1] if lines else None


@pytest.fixture(scope="session")
def admin_token():
    env = os.getenv("E2E_ADMIN_TOKEN")
    if env:
        return env
    try:
        return _token_via_subprocess()
    except Exception as e:
        print(f"[e2e] 无法生成 admin token: {e}")
        return None


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    setattr(item, "rep_" + rep.when, rep)


@pytest.fixture(autouse=True)
def _screenshot_on_failure(request):
    yield
    rep = getattr(request.node, "rep_call", None)
    if not rep or not rep.failed:
        return
    driver = None
    for name in ("driver", "mobile_driver"):
        if name in request.fixturenames:
            try:
                driver = request.getfixturevalue(name)
            except Exception:
                pass
    if not driver:
        return
    safe = request.node.name.replace("/", "_")
    path = REPORTS / f"{safe}.png"
    try:
        driver.save_screenshot(str(path))
        logs = driver.get_log("browser")
        (REPORTS / f"{safe}.log").write_text("\n".join(f"{x['level']}: {x['message']}" for x in logs), encoding="utf-8")
        print(f"[e2e] 失败截图: {path}")
    except Exception as e:
        print(f"[e2e] 截图失败: {e}")

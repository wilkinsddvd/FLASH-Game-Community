import os
import time

import httpx
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from utils import goto, inject_token, wait_css

API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000").rstrip("/")
E2E_BASE = os.getenv("E2E_BASE_URL", "http://localhost:3001")
ALLOW_REMOTE_WRITES = os.getenv("ALLOW_REMOTE_WRITES") == "1"


def _fill_by_label(driver, label, value):
    WebDriverWait(driver, 8).until(lambda d: len(d.find_elements(By.CSS_SELECTOR, ".el-dialog .el-form-item")) > 0)
    items = driver.find_elements(By.CSS_SELECTOR, ".el-dialog .el-form-item")
    for item in items:
        text = item.find_element(By.CSS_SELECTOR, ".el-form-item__label").text
        if label in text:
            inp = item.find_element(By.CSS_SELECTOR, "input, textarea")
            inp.clear()
            inp.send_keys(value)
            return
    raise AssertionError(f"找不到表单项 {label}")


def _click_dialog_button(driver, text):
    for b in driver.find_elements(By.CSS_SELECTOR, ".el-dialog button"):
        if b.text.strip() == text:
            b.click()
            return
    raise AssertionError(f"找不到按钮 {text}")


def test_banner_admin_save_and_delete(driver, admin_token):
    if not admin_token:
        pytest.skip("没有 admin token")
    if "localhost" not in E2E_BASE and "127.0.0.1" not in E2E_BASE and not ALLOW_REMOTE_WRITES:
        pytest.skip("非本地环境，默认不执行后台写操作（ALLOW_REMOTE_WRITES=1 可放开）")
    inject_token(driver, admin_token)
    goto(driver, "/admin/banners")
    assert wait_css(driver, ".page-title").text.strip() == "Banner管理"

    title = f"E2E 自检 Banner {int(time.time())}"
    # 清理历史失败残留
    with httpx.Client(base_url=API_BASE, timeout=15) as c:
        rows = c.get("/api/admin/banners", headers={"Authorization": f"Bearer {admin_token}"}).json()
        for r in rows:
            if str(r.get("title", "")).startswith("E2E 自检 Banner"):
                c.delete(f"/api/admin/banners/{r['id']}", headers={"Authorization": f"Bearer {admin_token}"})

    driver.find_element(By.XPATH, "//button[contains(., '新建Banner')]").click()
    wait_css(driver, ".el-dialog")
    _fill_by_label(driver, "标题", title)
    _fill_by_label(driver, "图片", "/squad-assets/raas/maps/mutaha.webp")
    _click_dialog_button(driver, "保存")

    WebDriverWait(driver, 10).until(
        lambda d: any("保存成功" in m.text for m in d.find_elements(By.CSS_SELECTOR, ".el-message"))
    )
    assert title in driver.find_element(By.TAG_NAME, "body").text

    with httpx.Client(base_url=API_BASE, timeout=15) as c:
        rows = c.get("/api/admin/banners", headers={"Authorization": f"Bearer {admin_token}"}).json()
        match = [r for r in rows if r["title"] == title]
        assert match
        for r in match:
            c.delete(f"/api/admin/banners/{r['id']}", headers={"Authorization": f"Bearer {admin_token}"})


def test_banner_missing_image_shows_error(driver, admin_token):
    if not admin_token:
        pytest.skip("没有 admin token")
    inject_token(driver, admin_token)
    goto(driver, "/admin/banners")
    driver.find_element(By.XPATH, "//button[contains(., '新建Banner')]").click()
    wait_css(driver, ".el-dialog")
    _fill_by_label(driver, "标题", "E2E 缺图")
    _click_dialog_button(driver, "保存")
    WebDriverWait(driver, 8).until(
        lambda d: "请先上传图片或填写图片 URL" in d.find_element(By.TAG_NAME, "body").text
    )
    _click_dialog_button(driver, "取消")

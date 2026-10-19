import io
import os
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000")
ALLOW_REMOTE_WRITES = os.getenv("ALLOW_REMOTE_WRITES") == "1"


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200


def test_openapi_has_new_banner_upload(client):
    r = client.get("/openapi.json")
    assert r.status_code == 200
    paths = r.json().get("paths", {})
    assert "/api/admin/banners/upload" in paths
    assert "/api/banners" in paths
    assert "/api/squad/public" in paths


def test_public_banners(client):
    r = client.get("/api/banners")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    for b in data:
        assert b.get("status") == 1
        assert b.get("title")
        assert b.get("image_url")


def test_squad_public(client):
    r = client.get("/api/squad/public")
    assert r.status_code == 200
    data = r.json()
    assert data.get("enabled") is True
    assert len(data.get("factions") or []) == 17
    assert sum(len(f.get("rosters") or []) for f in data["factions"]) == 80


def test_home_lists(client):
    for path in (
        "/api/articles?category=news&page_size=4",
        "/api/videos",
        "/api/message-board",
        "/api/likes",
    ):
        r = client.get(path)
        assert r.status_code == 200, path


def test_admin_banner_requires_auth(client):
    r = client.get("/api/admin/banners")
    assert r.status_code in (401, 403)


def test_admin_banner_list_with_token(client, admin_token):
    r = client.get("/api/admin/banners", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_banner_create_validation(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = client.post("/api/admin/banners", json={"title": "x", "image_url": ""}, headers=headers)
    assert r.status_code == 422


def test_banner_upload_rejects_text(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    files = {"file": ("x.txt", b"not an image", "text/plain")}
    r = client.post("/api/admin/banners/upload", files=files, headers=headers)
    assert r.status_code == 400


def test_banner_upload_and_delete(client, admin_token):
    if "localhost" not in API_BASE and "127.0.0.1" not in API_BASE and not ALLOW_REMOTE_WRITES:
        pytest.skip("非本地 API，默认不执行写操作（ALLOW_REMOTE_WRITES=1 可放开）")
    headers = {"Authorization": f"Bearer {admin_token}"}
    # 1x1 PNG
    png = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
        b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    files = {"file": ("tiny.png", png, "image/png")}
    r = client.post("/api/admin/banners/upload", files=files, headers=headers)
    assert r.status_code == 200, r.text
    url = r.json().get("url")
    assert url and url.startswith("/uploads/banners/")

    created = client.post(
        "/api/admin/banners",
        json={"title": "自动化测试 Banner", "image_url": url, "status": 0},
        headers=headers,
    )
    assert created.status_code == 201, created.text
    bid = created.json()["id"]
    try:
        listed = client.get("/api/admin/banners", headers=headers)
        assert any(b["id"] == bid for b in listed.json())
    finally:
        client.delete(f"/api/admin/banners/{bid}", headers=headers)
        # 清理上传文件（本地上传目录）
        target = ROOT / "FLASH_END_PRO" / url.lstrip("/")
        if target.exists():
            target.unlink()

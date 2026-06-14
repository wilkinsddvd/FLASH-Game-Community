import os
from pathlib import Path

from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = f"sqlite:///{Path(__file__).resolve().parent / 'test.db'}"

from app.main import Base, Role, SessionLocal, User, app, engine


client = TestClient(app)


def setup_module():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        db.add(User(username="admin", role=Role.admin))
        db.commit()


def _create_unknown(username: str) -> int:
    response = client.post("/api/users", json={"username": username})
    assert response.status_code == 201
    return response.json()["id"]


def test_admin_content_crud_and_unknown_read_only():
    admin_id = 1

    denied = client.post("/api/content/display", json={"title": "x", "body": "y"})
    assert denied.status_code == 401

    created = client.post(
        "/api/content/display",
        headers={"x-user-id": str(admin_id)},
        json={"title": "Intro", "body": "Static game content"},
    )
    assert created.status_code == 201
    content_id = created.json()["id"]

    fetched = client.get("/api/content/display")
    assert fetched.status_code == 200
    assert len(fetched.json()) == 1

    updated = client.put(
        f"/api/content/display/{content_id}",
        headers={"x-user-id": str(admin_id)},
        json={"title": "Intro2", "body": "updated"},
    )
    assert updated.status_code == 200

    deleted = client.delete(
        f"/api/content/display/{content_id}",
        headers={"x-user-id": str(admin_id)},
    )
    assert deleted.status_code == 204


def test_role_transitions_and_forum_permissions():
    admin_id = 1
    operator_id = _create_unknown("operator")
    gamer_id = _create_unknown("gamer")
    unknown_id = _create_unknown("unknown")

    appoint = client.post(f"/api/users/{operator_id}/appoint-operator", headers={"x-user-id": str(admin_id)})
    assert appoint.status_code == 200

    promote = client.post(f"/api/users/{gamer_id}/promote-to-gamer?confirmed=true", headers={"x-user-id": str(admin_id)})
    assert promote.status_code == 200

    op_promote = client.post(f"/api/users/{unknown_id}/promote-to-gamer", headers={"x-user-id": str(operator_id)})
    assert op_promote.status_code == 200

    blocked_unknown = client.post("/api/posts", headers={"x-user-id": "9999"}, json={"title": "x", "body": "y"})
    assert blocked_unknown.status_code == 404

    gamer_post = client.post(
        "/api/posts",
        headers={"x-user-id": str(gamer_id)},
        json={"title": "攻略", "body": "内容"},
    )
    assert gamer_post.status_code == 201
    gamer_post_id = gamer_post.json()["id"]

    pin_denied = client.patch(f"/api/posts/{gamer_post_id}/pin", headers={"x-user-id": str(operator_id)})
    assert pin_denied.status_code == 403

    pin_ok = client.patch(f"/api/posts/{gamer_post_id}/pin", headers={"x-user-id": str(admin_id)})
    assert pin_ok.status_code == 200

    operator_post = client.post(
        "/api/posts",
        headers={"x-user-id": str(operator_id)},
        json={"title": "公告", "body": "operator content"},
    )
    assert operator_post.status_code == 201
    operator_post_id = operator_post.json()["id"]

    retract_operator_by_admin = client.patch(
        f"/api/posts/{operator_post_id}/retract",
        headers={"x-user-id": str(admin_id)},
    )
    assert retract_operator_by_admin.status_code == 200

    retract_gamer_by_operator = client.patch(
        f"/api/posts/{gamer_post_id}/retract",
        headers={"x-user-id": str(operator_id)},
    )
    assert retract_gamer_by_operator.status_code == 200

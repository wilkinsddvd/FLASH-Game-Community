"""
前端静态资源 Locust 场景（需要 host 指向前端，如 http://localhost:3001）

用法：
  locust -f tests/perf/locust_static.py --headless -u 20 -r 5 -t 1m \
         --host http://localhost:3001 --html tests/reports/static.html
"""
from locust import HttpUser, between, task


class StaticUser(HttpUser):
    weight = 1
    wait_time = between(0.5, 2)

    @task(5)
    def home(self):
        with self.client.get("/", name="/", catch_response=True) as r:
            if r.status_code != 200:
                r.failure(f"HTTP {r.status_code}")

    @task(3)
    def heightmap(self):
        with self.client.get("/squad-assets/heightmaps/mutaha.bin", name="/heightmap", catch_response=True) as r:
            if r.status_code != 200:
                r.failure(f"HTTP {r.status_code}")

    @task(2)
    def contour(self):
        with self.client.get("/squad-assets/contours/lashkar.svg", name="/contour", catch_response=True) as r:
            if r.status_code != 200:
                r.failure(f"HTTP {r.status_code}")

    @task(2)
    def map_image(self):
        with self.client.get("/squad-assets/raas/maps/mutaha.webp", name="/map-image", catch_response=True) as r:
            if r.status_code != 200:
                r.failure(f"HTTP {r.status_code}")

    @task(2)
    def vehicle_image(self):
        with self.client.get("/squad-assets/vehicles/v2/m1a1infocard.webp", name="/vehicle-image", catch_response=True) as r:
            if r.status_code != 200:
                r.failure(f"HTTP {r.status_code}")

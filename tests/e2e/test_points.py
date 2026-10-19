import re

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from utils import goto, wait_all, wait_css, texts


def test_points_mode_and_invasion_maps(driver):
    goto(driver, "/squad/points")
    cards = wait_all(driver, ".mode-card")
    assert len(cards) == 2
    names = texts(driver, ".mode-name")
    assert names == ["RAAS", "Invasion"]

    cards[1].click()
    WebDriverWait(driver, 10).until(lambda d: "/squad/points/invasion" in d.current_url)
    maps = wait_all(driver, ".raas-card")
    assert len(maps) == 22
    assert "Invasion" in wait_css(driver, ".raas-hero h1").text


def test_invasion_attacker_auto_spawn_and_narrow(driver):
    goto(driver, "/squad/points/invasion/AlBasrah_Invasion_v1")
    assert wait_css(driver, ".raas-map-name").text.strip() == "Al Basrah"
    assert len(wait_all(driver, ".confirm-list li")) == 1
    assert not driver.find_elements(By.CSS_SELECTOR, ".raas-gate")
    status = wait_css(driver, ".stat-row").text
    assert "/ 5" in status

    driver.find_element(By.CSS_SELECTOR, ".bubble.next").click()
    WebDriverWait(driver, 5).until(lambda d: len(d.find_elements(By.CSS_SELECTOR, ".confirm-list li")) == 2)
    status = driver.find_element(By.CSS_SELECTOR, ".stat-row").text
    alive = int(re.match(r"(\d+)", status.strip()).group(1))
    assert 0 < alive < 5


def test_old_raas_url_redirects(driver):
    goto(driver, "/squad/raas/Mutaha_RAAS_v1")
    assert "/squad/points/raas/Mutaha_RAAS_v1" in driver.current_url
    assert wait_css(driver, ".raas-gate")

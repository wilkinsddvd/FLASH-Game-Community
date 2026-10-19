import re

from selenium.webdriver.common.by import By

from utils import goto, wait_all, wait_css, texts


def test_roster_15_class_groups(driver):
    goto(driver, "/squad/USMC/usmc-light")
    groups = wait_all(driver, ".group-row")
    assert len(groups) > 0
    rows = driver.find_elements(By.CSS_SELECTOR, ".roster-table tbody tr:not(.group-row)")
    assert len(rows) > 0

    total = 0
    for g in groups:
        m = re.search(r"(\d+)\s*型号", g.text)
        assert m, g.text
        total += int(m.group(1))
    assert total == len(rows)

    chips = texts(driver, ".filter-btn")
    assert "全部" in chips[0]
    assert any("侦察车" in c or "补给载具" in c for c in chips)


def test_roster_filter(driver):
    goto(driver, "/squad/USMC/usmc-light")
    chips = driver.find_elements(By.CSS_SELECTOR, ".filter-btn")
    target = next(c for c in chips if "侦察车" in c.text)
    target.click()
    groups = wait_all(driver, ".group-row")
    assert len(groups) == 1
    assert "侦察车" in groups[0].text

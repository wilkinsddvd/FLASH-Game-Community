from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from utils import goto, wait_all, wait_css, texts, set_input_js


def test_vehicle_faction_picker_and_faction_page(driver):
    goto(driver, "/squad/vehicles")
    cards = wait_all(driver, ".fac-pick-card")
    assert len(cards) == 17
    flags = driver.find_elements(By.CSS_SELECTOR, ".fac-pick-flag")
    assert all(f.size["width"] >= 90 for f in flags)

    cards[0].click()
    WebDriverWait(driver, 10).until(lambda d: "/squad/vehicles/" in d.current_url)
    crumb = wait_css(driver, ".crumb-current").text
    assert crumb.startswith("USMC") or crumb.startswith("USA") or crumb.startswith("RGF")
    assert len(wait_all(driver, ".veh-card")) > 0
    tags = set(texts(driver, ".tag-fac"))
    assert len(tags) == 1


def test_vehicle_faction_search_and_filter(driver):
    goto(driver, "/squad/vehicles/USMC")
    assert len(wait_all(driver, ".veh-card")) > 0
    search = wait_css(driver, ".search-input")
    set_input_js(driver, search, "M1A1")
    WebDriverWait(driver, 5).until(lambda d: 0 < len(d.find_elements(By.CSS_SELECTOR, ".veh-card")) < 17)
    set_input_js(driver, search, "")
    WebDriverWait(driver, 5).until(lambda d: len(d.find_elements(By.CSS_SELECTOR, ".veh-card")) > 1)
    chips = driver.find_elements(By.CSS_SELECTOR, ".cat-chip")
    tank = next(c for c in chips if "坦克" in c.text)
    tank.click()
    WebDriverWait(driver, 5).until(lambda d: len(d.find_elements(By.CSS_SELECTOR, ".veh-card")) == 1)


def test_vehicle_mobile_drawer(mobile_driver):
    goto(mobile_driver, "/squad/vehicles/USMC")
    assert len(wait_all(mobile_driver, ".veh-card")) > 0
    card = mobile_driver.find_element(By.CSS_SELECTOR, ".veh-card")
    mobile_driver.execute_script("arguments[0].click()", card)
    assert wait_css(mobile_driver, ".sheet-mask")
    overflow = mobile_driver.execute_script("return document.documentElement.scrollWidth - window.innerWidth")
    assert overflow <= 2

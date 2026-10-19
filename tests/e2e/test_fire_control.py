from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait

from utils import goto, wait_css


def _set_grid(driver, index, value):
    inputs = driver.find_elements(By.CSS_SELECTOR, ".fc-coord-row input")
    el = inputs[index]
    el.clear()
    el.send_keys(value)
    driver.execute_script("arguments[0].dispatchEvent(new Event('blur', {bubbles:true}))", el)


def test_fire_control_grid_and_auto_height(driver):
    goto(driver, "/squad/fire-control")
    selects = driver.find_elements(By.CSS_SELECTOR, ".fc-controls select")
    assert len(Select(selects[0]).options) == 23
    Select(selects[0]).select_by_visible_text("Mutaha")

    _set_grid(driver, 0, "D4-6-3")
    _set_grid(driver, 1, "D4-8-3")

    WebDriverWait(driver, 8).until(
        lambda d: d.find_element(By.CSS_SELECTOR, ".fc-metric.primary .fc-metric-value").text.strip() != "—"
    )
    primary = driver.find_element(By.CSS_SELECTOR, ".fc-metric.primary .fc-metric-value").text
    assert "mil" in primary
    metrics = driver.find_element(By.CSS_SELECTOR, ".fc-result").text
    assert "141" in metrics or "142" in metrics
    elevs = [e.text.strip() for e in driver.find_elements(By.CSS_SELECTOR, ".fc-elev")]
    assert all("—" not in e for e in elevs)
    assert driver.find_element(By.CSS_SELECTOR, ".fc-contour-lines").get_attribute("src").endswith("mutaha.svg")


def test_fire_control_mobile_no_overflow(mobile_driver):
    goto(mobile_driver, "/squad/fire-control")
    overflow = mobile_driver.execute_script("return document.documentElement.scrollWidth - window.innerWidth")
    assert overflow <= 2
    assert wait_css(mobile_driver, ".fc-map")
    assert wait_css(mobile_driver, ".fc-contour-card")

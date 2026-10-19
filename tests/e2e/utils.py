import os
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = os.getenv("E2E_BASE_URL", "http://localhost:3001").rstrip("/")


def goto(driver, path=""):
    driver.get(BASE_URL + path)
    wait_ready(driver)


def wait_ready(driver, timeout=25):
    WebDriverWait(driver, timeout).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )
    # 等待 Vue 挂载
    WebDriverWait(driver, timeout).until(
        lambda d: d.execute_script("return !!document.querySelector('#app') && document.querySelector('#app').children.length > 0")
    )
    time.sleep(0.3)


def wait_css(driver, selector, timeout=15):
    return WebDriverWait(driver, timeout).until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))


def wait_all(driver, selector, timeout=15):
    return WebDriverWait(driver, timeout).until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, selector)))


def texts(driver, selector):
    return [e.text.strip() for e in driver.find_elements(By.CSS_SELECTOR, selector)]


def set_input(driver, selector, value):
    el = wait_css(driver, selector)
    el.clear()
    el.send_keys(value)
    return el


def set_input_js(driver, element, value):
    driver.execute_script(
        "arguments[0].value = arguments[1];"
        "arguments[0].dispatchEvent(new Event('input', {bubbles:true}));"
        "arguments[0].dispatchEvent(new Event('change', {bubbles:true}));",
        element,
        value,
    )


def inject_token(driver, token):
    driver.get(BASE_URL + "/home")
    wait_ready(driver)
    driver.execute_script(
        "localStorage.setItem('flash_token', arguments[0]);"
        "localStorage.setItem('flash_user', JSON.stringify({username:'e2e_admin', role:'super_admin'}));",
        token,
    )
    driver.refresh()
    wait_ready(driver)

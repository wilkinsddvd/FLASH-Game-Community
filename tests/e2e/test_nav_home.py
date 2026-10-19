from utils import goto, texts, wait_css, wait_all


def test_nav_and_home_order(driver):
    goto(driver, "/home")
    nav = texts(driver, ".main-nav a")
    assert nav == ["首页", "攻略", "Squad编制", "点位推测", "载具信息", "火控计算器", "基础认证", "SQUAD闪电谈", "关于"]
    blocks = texts(driver, ".home-main .card-title")
    assert blocks[0].startswith("最新资讯")
    assert blocks[1].startswith("▶️ B站视频")
    assert blocks[2].startswith("🎖️ Squad 编制")
    assert blocks[3].startswith("基础认证")
    assert wait_css(driver, ".board-head-title").text.strip() == "留言板"
    assert "感谢你使用本网站" not in driver.find_element("tag name", "body").text


def test_feedback_and_board_redirects(driver):
    goto(driver, "/feedback")
    assert driver.current_url.endswith("/about#feedback")
    assert wait_css(driver, ".like-section")
    goto(driver, "/board")
    assert driver.current_url.endswith("/home#board")
    assert wait_css(driver, "#board .board-wrap")


def test_mobile_no_horizontal_overflow(mobile_driver):
    goto(mobile_driver, "/home")
    overflow = mobile_driver.execute_script("return document.documentElement.scrollWidth - window.innerWidth")
    assert overflow <= 2
    assert len(wait_all(mobile_driver, ".main-nav a")) == 9

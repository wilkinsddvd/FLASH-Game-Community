/**
 * 路由快速切换回归：验证不会出现「空白页」
 *
 * 背景：App.vue 曾用 <transition mode="out-in">，快速连点导航时离场动画被打断，
 * 会停在「旧页已移除、新页未进入」的空白状态，只能刷新恢复。
 *
 * 用法：
 *   RAAS_UI_BASE=http://localhost:3001 node scripts/test-route-nav.mjs
 *
 * 前置：前端 dev server 已启动。全部通过退出码 0。
 */
import { connect } from './lib/cdp.mjs'

const BASE = process.env.RAAS_UI_BASE || process.env.UI_BASE || 'http://localhost:3001'
const HREFS = [
  '/home', '/guide', '/squad', '/squad/points', '/squad/points/raas',
  '/squad/points/invasion', '/squad/vehicles', '/squad/fire-control',
  '/cert', '/about', '/forum', '/login',
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const MAIN_STATE = `(() => {
  const main = document.querySelector('main.main-content');
  return JSON.stringify({
    path: location.pathname,
    children: main ? main.children.length : -1,
    len: ((main && main.innerText) || '').trim().length,
  });
})()`

let checks = 0
let blanks = 0
const failures = []
const cdp = await connect({ port: 9452, userDataDir: '/tmp/flash-route-nav' })

try {
  await cdp.viewport(1440, 1000, { mobile: false })

  for (let round = 0; round < 2; round++) {
    await cdp.navigate(BASE + '/home', 1800)
    cdp.consoleLogs(true)

    // 20 次随机跳转，间隔 20–100ms（覆盖“动画没走完就切下一页”的真实场景）
    for (let i = 0; i < 20; i++) {
      const href = HREFS[Math.floor(Math.random() * HREFS.length)]
      await cdp.evaluate(`(() => { const a=document.querySelector('.main-nav a[href="${href}"]'); if(a) a.click(); return 'ok'; })()`)
      await sleep(20 + Math.random() * 80)
    }

    await sleep(900)
    const st = JSON.parse(await cdp.evaluate(MAIN_STATE))
    checks++
    if (st.children < 1 || st.len < 5) {
      blanks++
      failures.push({ round, ...st })
    }

    const errors = cdp.consoleLogs(true).filter((l) => l.type === 'exception' || l.type === 'error')
    if (errors.length) failures.push({ round, errors: errors.slice(-3) })
  }

  // 再压一遍后退键
  await cdp.navigate(BASE + '/home', 1500)
  for (let i = 0; i < 10; i++) {
    await cdp.evaluate(`(() => { const a=document.querySelector('.main-nav a[href="${HREFS[i % HREFS.length]}"]'); if(a) a.click(); return 'ok'; })()`)
    await sleep(100)
  }
  for (let i = 0; i < 8; i++) {
    await cdp.evaluate('history.back(); "ok"')
    await sleep(80)
    const st = JSON.parse(await cdp.evaluate(MAIN_STATE))
    checks++
    if (st.children < 1 || st.len < 5) {
      blanks++
      failures.push({ back: i, ...st })
    }
  }
} finally {
  await cdp.close()
}

if (blanks || failures.length) {
  console.error('❌ 路由切换出现异常：')
  console.error(JSON.stringify(failures, null, 2))
  process.exit(1)
}

console.log(`✅ 路由快速切换 ${checks} 次检查，无空白页`)

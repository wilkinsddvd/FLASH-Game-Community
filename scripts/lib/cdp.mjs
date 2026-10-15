/**
 * 极简 CDP 客户端（零依赖，Node ≥ 20 自带 WebSocket）
 * 用于无头 Chromium 打开页面、真实派发指针事件、截图。
 *
 * 用法：
 *   const cdp = await connect()
 *   await cdp.navigate(url)
 *   await cdp.clickAt(x, y)          // 真实鼠标事件（pointerdown/up + click）
 *   await cdp.tapAt(x, y)            // 真实触摸事件
 *   await cdp.screenshot('/tmp/a.png')
 *   await cdp.close()                // 自己启动的浏览器会被关掉
 */
import { spawn } from 'node:child_process'
import { existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname } from 'node:path'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** 找一个可用的 Chromium/Chrome 可执行文件 */
export function findBrowser() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN
  const cache = `${homedir()}/Library/Caches/ms-playwright`
  if (existsSync(cache)) {
    const dirs = readdirSync(cache).filter((d) => /^chromium(_headless_shell)?-/.test(d))
    for (const d of dirs) {
      for (const rel of ['chrome-mac/headless_shell', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
        const p = `${cache}/${d}/${rel}`
        if (existsSync(p)) return p
      }
    }
  }
  for (const p of [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
  ]) if (existsSync(p)) return p
  throw new Error('没找到 Chromium/Chrome，可用环境变量 CHROME_BIN 指定')
}

export async function connect(opts = {}) {
  const port = opts.port ?? 9333
  const base = `http://127.0.0.1:${port}`
  let child = null

  let ok = await fetch(`${base}/json/version`).then((r) => r.ok).catch(() => false)
  if (!ok) {
    const bin = opts.browserPath || findBrowser()
    const userDataDir = opts.userDataDir || `/tmp/raas-cdp-${port}`
    child = spawn(bin, [
      '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--remote-debugging-port=' + port, '--remote-allow-origins=*',
      '--user-data-dir=' + userDataDir, 'about:blank',
    ], { stdio: 'ignore', detached: false })
    for (let i = 0; i < 60; i++) {
      await sleep(250)
      ok = await fetch(`${base}/json/version`).then((r) => r.ok).catch(() => false)
      if (ok) break
    }
    if (!ok) { child?.kill(); throw new Error('浏览器没起来（remote debugging 端口未响应）') }
  }

  const list = await (await fetch(`${base}/json/list`)).json()
  const page = list.find((t) => t.type === 'page')
  if (!page) throw new Error('没有可用的 page target')

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let seq = 0
  const pending = new Map()
  /** 控制台 error/warn 收集（页面里的 Vue 警告、JS 报错都在这） */
  const consoleLogs = []
  ws.addEventListener('message', async (ev) => {
    let raw = ev.data
    // ⚠️ 大 payload（截图）可能以 Blob 到达，必须先取文本
    if (typeof raw !== 'string') raw = typeof raw.text === 'function' ? await raw.text() : Buffer.from(raw).toString()
    let msg
    try { msg = JSON.parse(raw) } catch { return }
    if (msg.method === 'Runtime.consoleAPICalled' && (msg.params.type === 'error' || msg.params.type === 'warning')) {
      const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ')
      consoleLogs.push({ type: msg.params.type, text: String(text).slice(0, 300) })
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails || {}
      consoleLogs.push({ type: 'exception', text: String(d.exception?.description || d.text || '').slice(0, 300) })
    }
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
  })
  await new Promise((r) => ws.addEventListener('open', r))

  function send(method, params = {}) {
    const id = ++seq
    ws.send(JSON.stringify({ id, method, params }))
    return Promise.race([
      new Promise((res) => pending.set(id, res)),
      new Promise((res) => setTimeout(() => res({ __timeout: true }), opts.timeoutMs ?? 25000)),
    ])
  }

  const api = {
    send,
    async evaluate(expression) {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
      if (r.__timeout) throw new Error('evaluate 超时: ' + expression.slice(0, 120))
      if (r.error) throw new Error('evaluate 协议错误: ' + JSON.stringify(r.error).slice(0, 300))
      if (r.result && r.result.exceptionDetails) {
        throw new Error('evaluate 失败: ' + JSON.stringify(r.result.exceptionDetails.exception || r.result.exceptionDetails))
      }
      return r.result && r.result.result ? r.result.result.value : undefined
    },
    async viewport(width, height, { deviceScaleFactor = 1, mobile = false } = {}) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor, mobile })
    },
    async navigate(url, waitMs = 3500) {
      await send('Page.navigate', { url })
      await sleep(waitMs)
    },
    async clickAt(x, y, { gap = 45 } = {}) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 })
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
      await sleep(gap)
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 })
    },
    async wheelAt(x, y, deltaY) {
      // ⚠️ 先移一下鼠标：Chrome 的 mouseWheel 会按「最后一次鼠标移动」的元素路由，
      // 不发 mouseMoved 时目标元素可能是旧的，滚轮就“没反应”。
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 })
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY })
    },
    /**
     * 冻结 CSS 动画/过渡。
     * ⚠️ 页面里有无限循环动画（下一步点位的脉动）时，Page.captureScreenshot
     * 会一直等帧，实测要几十秒。截图前调一下这个就回到毫秒级。
     */
    async freezeAnimations() {
      await api.evaluate(`(() => {
        if (document.getElementById('__cdp_no_anim')) return 'ok';
        const s = document.createElement('style');
        s.id = '__cdp_no_anim';
        s.textContent = '* { animation: none !important; transition: none !important; }';
        document.head.appendChild(s);
        return 'ok';
      })()`)
    },
    async tapAt(x, y) {
      await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
      await sleep(60)
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    },
    async screenshot(file, clip) {
      const params = { format: 'png' }
      if (clip) params.clip = clip
      const r = await send('Page.captureScreenshot', params)
      if (r.__timeout || !r.result) return null
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, Buffer.from(r.result.data, 'base64'))
      return file
    },
    async close() {
      try { ws.close() } catch { /* 忽略 */ }
      if (child) { try { child.kill() } catch { /* 忽略 */ } }
    },
    /** 到目前为止页面抛过的 error/warning（含 Vue 警告），可随时清空 */
    consoleLogs(clear = false) {
      const out = consoleLogs.slice()
      if (clear) consoleLogs.length = 0
      return out
    },
  }

  await send('Page.enable')
  await send('Runtime.enable')
  return api
}

export { sleep }

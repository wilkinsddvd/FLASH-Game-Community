/**
 * 火控：弹道解算 + 高程采样
 *
 * 公式与 squadmaps-v2（MIT）一致：
 *   d = hypot(dx, dy) / 100
 *   h = z_target - (z_src + heightOffset)
 *   inner = v⁴ - g(g d² + 2 h v²)
 *   θ_low  = atan((v² - √inner)/(g d))
 *   θ_high = atan((v² + √inner)/(g d))
 *   TOF    = (v sinθ + √(v² sin²θ - 2gh)) / g
 *   mil    = deg × 6400 / 360
 */

export const GRAVITY = 9.78

const DEG = Math.PI / 180
const RAD = 180 / Math.PI

export function velocityAt(weapon, shellIndex, distanceM) {
  const shell = weapon.shells[shellIndex] || weapon.shells[0]
  if (shell.velocity) return shell.velocity
  const table = weapon.velocityTable
  if (!table || !table.length) return 0
  if (distanceM <= table[0][0]) return table[0][1]
  if (distanceM >= table[table.length - 1][0]) return table[table.length - 1][1]
  for (let i = 1; i < table.length; i++) {
    const [d1, v1] = table[i]
    if (distanceM <= d1) {
      const [d0, v0] = table[i - 1]
      const t = (distanceM - d0) / (d1 - d0 || 1)
      return v0 + (v1 - v0) * t
    }
  }
  return table[table.length - 1][1]
}

export function maxRange(weapon, shellIndex = 0) {
  if (weapon.velocityTable && weapon.velocityTable.length) {
    return weapon.velocityTable[weapon.velocityTable.length - 1][0]
  }
  const v = velocityAt(weapon, shellIndex, 0)
  return (v * v) / (GRAVITY * weapon.gravityScale)
}

export function milFromDeg(deg) {
  return deg * 6400 / 360
}

export function degFromMil(mil) {
  return mil * 360 / 6400
}

/** 主显示单位：迫击炮用密位，其余用度 */
export function formatAngle(deg, unit) {
  if (!Number.isFinite(deg)) return '—'
  if (unit === 'mil') return `${Math.round(milFromDeg(deg))} mil`
  return `${deg.toFixed(1)}°`
}

export function formatDistance(m) {
  if (!Number.isFinite(m)) return '—'
  return `${Math.round(m)} m`
}

export function formatTime(s) {
  if (!Number.isFinite(s)) return '—'
  return `${s.toFixed(1)} s`
}

/**
 * @param {object} p
 * @param {object} p.weapon
 * @param {number} p.shellIndex
 * @param {{x:number,y:number}} p.src 世界坐标 cm
 * @param {{x:number,y:number}} p.target
 * @param {number|null} p.zSrc 米
 * @param {number|null} p.zTarget 米
 * @param {number} p.manualHeight 手动高差（米），null 表示用高程
 * @returns {object}
 */
export function solveFiringSolution({
  weapon,
  shellIndex = 0,
  src,
  target,
  zSrc = null,
  zTarget = null,
  manualHeight = null,
}) {
  const dxM = (target.x - src.x) / 100
  const dyM = (target.y - src.y) / 100
  const dist = Math.hypot(dxM, dyM)
  // 0° = 北（-y），顺时针
  let bearing = Math.atan2(dxM, -dyM) * RAD
  if (bearing < 0) bearing += 360

  const shell = weapon.shells[shellIndex] || weapon.shells[0]
  const v = velocityAt(weapon, shellIndex, dist)
  const g = GRAVITY * weapon.gravityScale
  const autoHeight = (zSrc !== null && zTarget !== null)
  const hDiff = manualHeight !== null
    ? manualHeight
    : (autoHeight ? zTarget - (zSrc + weapon.heightOffset) : 0)

  const result = {
    dist,
    bearing,
    hDiff,
    zSrc,
    zTarget,
    autoHeight,
    manualHeight,
    unit: weapon.unit,
    shell,
    velocity: v,
    maxRange: maxRange(weapon, shellIndex),
    minDistance: shell.minDistance ?? weapon.minDistance ?? 0,
    belowMin: dist < (shell.minDistance ?? weapon.minDistance ?? 0),
    inRange: false,
    low: null,
    high: null,
    primary: null,
    reason: '',
  }

  const v2 = v * v
  const v4 = v2 * v2
  const inner = v4 - g * (g * dist * dist + 2 * hDiff * v2)
  if (dist <= 0) {
    result.reason = '请先选择炮位和目标'
    return result
  }
  if (inner < 0) {
    result.reason = `超出最大射程（约 ${Math.round(result.maxRange)} m）`
    return result
  }

  const P = Math.sqrt(inner)
  const offset = (weapon.angleOffset || 0) * DEG
  const lowRad = Math.atan((v2 - P) / (g * dist)) - offset
  const highRad = Math.atan((v2 + P) / (g * dist)) - offset

  const build = (rad) => {
    const deg = rad * RAD
    const sin = Math.sin(rad)
    const tofInner = v2 * sin * sin - 2 * g * hDiff
    const tof = tofInner >= 0 ? (v * sin + Math.sqrt(tofInner)) / g : NaN
    const valid = Number.isFinite(rad) &&
      deg >= weapon.minElevation[0] - 1e-6 &&
      deg <= weapon.minElevation[1] + 1e-6 &&
      Number.isFinite(tof)
    return {
      rad,
      deg,
      mil: milFromDeg(deg),
      tof,
      valid,
      belowMin: dist < (shell.minDistance ?? weapon.minDistance ?? 0),
    }
  }

  result.low = build(lowRad)
  result.high = build(highRad)
  result.primary = weapon.angleType === 'low' ? result.low : result.high
  result.inRange = !!(result.low.valid || result.high.valid) && !result.belowMin

  if (result.belowMin) {
    result.reason = `低于最小射距（${Math.round(result.minDistance)} m）`
  } else if (!result.inRange) {
    result.reason = '当前距离/高差没有可用射角（超出射界）'
  } else if (!result.primary.valid) {
    // 主分支不可用时，退回另一条可用分支
    result.primary = result.low.valid ? result.low : result.high
  }
  return result
}

/* ── 高程 ── */

export function decodeHeightmap(buffer, meta) {
  if (!buffer || !meta) return null
  return {
    rows: meta.rows,
    cols: meta.cols,
    scale: meta.scale || 10,
    data: new Int16Array(buffer),
  }
}

/** 双线性采样；返回米。行 0 = 北边 = ymin */
export function sampleHeight(layer, hm, x, y) {
  if (!hm || !hm.data || !layer) return null
  const c = layer.corners || []
  if (c.length < 2) return null
  const minX = Math.min(c[0][0], c[1][0])
  const maxX = Math.max(c[0][0], c[1][0])
  const minY = Math.min(c[0][1], c[1][1])
  const maxY = Math.max(c[0][1], c[1][1])
  const col = ((x - minX) / (maxX - minX || 1)) * (hm.cols - 1)
  const row = ((y - minY) / (maxY - minY || 1)) * (hm.rows - 1)
  if (col < 0 || col > hm.cols - 1 || row < 0 || row > hm.rows - 1) return null

  const r0 = Math.floor(row)
  const r1 = Math.min(hm.rows - 1, r0 + 1)
  const c0 = Math.floor(col)
  const c1 = Math.min(hm.cols - 1, c0 + 1)
  const fr = row - r0
  const fc = col - c0
  const at = (r, cc) => hm.data[r * hm.cols + cc] / hm.scale
  const h00 = at(r0, c0)
  const h01 = at(r0, c1)
  const h10 = at(r1, c0)
  const h11 = at(r1, c1)
  return (1 - fr) * ((1 - fc) * h00 + fc * h01) + fr * ((1 - fc) * h10 + fc * h11)
}

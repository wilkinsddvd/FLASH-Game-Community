/**
 * Squad 游戏内网格坐标 ↔ 世界坐标（cm）
 *
 * 口径（与游戏内一致）：
 * - 大格 300m × 300m，从地图左上角（西北 / minX,minY）起算
 * - 列：A/B/C… 向右；行：1/2/3… 向下
 * - 大格内一级 keypad 3×3，按小键盘布局：
 *     7 8 9
 *     4 5 6
 *     1 2 3
 * - keypad 内二级 sub-keypad 同样 3×3
 *
 * 输入支持：A1 / A1-6 / A1-6-3
 * 反算永远输出三级：A1-6-3
 */

export const GRID_MAJOR_M = 300
const GRID_MAJOR_CM = GRID_MAJOR_M * 100

function boundsOf(layer) {
  const c = (layer && layer.corners) || []
  if (c.length < 2) return null
  return {
    minX: Math.min(c[0][0], c[1][0]),
    maxX: Math.max(c[0][0], c[1][0]),
    minY: Math.min(c[0][1], c[1][1]),
    maxY: Math.max(c[0][1], c[1][1]),
  }
}

/** keypad 数字 → 格内列（0=左）/ 行（0=上） */
function numpadCell(n) {
  const i = n - 1
  return { col: i % 3, rowTop: 2 - Math.floor(i / 3) }
}

/**
 * 网格坐标 → 世界坐标（cm）
 * @param {object} layer 需要 corners
 * @param {string} input 例如 "D4-6-3"
 * @returns {{x:number,y:number,label:string,col:number,row:number,keypad:number|null,sub:number|null}|null}
 */
export function gridToWorld(layer, input) {
  const b = boundsOf(layer)
  if (!b) return null
  const s = String(input || '').trim().toUpperCase().replace(/[\s/]+/g, '-').replace(/-+/g, '-')
  const m = s.match(/^([A-Z])(\d{1,2})(?:[-_]?([1-9]))?(?:[-_]?([1-9]))?$/)
  if (!m) return null

  const col = m[1].charCodeAt(0) - 65
  const row = Number(m[2]) - 1
  const keypad = m[3] ? Number(m[3]) : null
  const sub = m[4] ? Number(m[4]) : null
  if (col < 0 || row < 0) return null

  const x0 = b.minX + col * GRID_MAJOR_CM
  const y0 = b.minY + row * GRID_MAJOR_CM
  if (x0 >= b.maxX || y0 >= b.maxY) return null

  let fx = 0.5
  let fy = 0.5
  if (keypad !== null) {
    const kp = numpadCell(keypad)
    if (sub !== null) {
      const sp = numpadCell(sub)
      fx = (kp.col + (sp.col + 0.5) / 3) / 3
      fy = (kp.rowTop + (sp.rowTop + 0.5) / 3) / 3
    } else {
      fx = (kp.col + 0.5) / 3
      fy = (kp.rowTop + 0.5) / 3
    }
  }

  const x = Math.min(b.maxX, x0 + fx * GRID_MAJOR_CM)
  const y = Math.min(b.maxY, y0 + fy * GRID_MAJOR_CM)
  return {
    x,
    y,
    col,
    row,
    keypad,
    sub,
    label: `${String.fromCharCode(65 + col)}${row + 1}${keypad !== null ? '-' + keypad : ''}${sub !== null ? '-' + sub : ''}`,
  }
}

/**
 * 世界坐标（cm）→ 三级网格坐标
 * @returns {{label:string,col:number,row:number,keypad:number,sub:number}|null}
 */
export function worldToGrid(layer, x, y) {
  const b = boundsOf(layer)
  if (!b) return null
  if (x < b.minX || x > b.maxX || y < b.minY || y > b.maxY) return null

  const col = Math.floor((x - b.minX) / GRID_MAJOR_CM)
  const row = Math.floor((y - b.minY) / GRID_MAJOR_CM)
  const x0 = b.minX + col * GRID_MAJOR_CM
  const y0 = b.minY + row * GRID_MAJOR_CM
  const fx = Math.min(0.999999, Math.max(0, (x - x0) / GRID_MAJOR_CM))
  const fy = Math.min(0.999999, Math.max(0, (y - y0) / GRID_MAJOR_CM))

  const kpCol = Math.min(2, Math.floor(fx * 3))
  const kpRowTop = Math.min(2, Math.floor(fy * 3))
  const subCol = Math.min(2, Math.floor((fx * 3 - kpCol) * 3))
  const subRowTop = Math.min(2, Math.floor((fy * 3 - kpRowTop) * 3))

  const keypad = (2 - kpRowTop) * 3 + kpCol + 1
  const sub = (2 - subRowTop) * 3 + subCol + 1
  const letter = String.fromCharCode(65 + col)
  return {
    label: `${letter}${row + 1}-${keypad}-${sub}`,
    col,
    row,
    keypad,
    sub,
  }
}

/** 只显示大格 + keypad（气泡/角标用） */
export function gridShort(layer, x, y) {
  const g = worldToGrid(layer, x, y)
  if (!g) return ''
  return `${String.fromCharCode(65 + g.col)}${g.row + 1}-${g.keypad}`
}

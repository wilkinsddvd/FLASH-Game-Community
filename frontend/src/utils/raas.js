/**
 * RAAS 点位工具 —— 坐标投影 + lane 求解
 *
 * 机制说明（与游戏一致）：
 *   一个随机化图层会先随机挑一条 lane（主基地→主基地），
 *   再沿该 lane 的每个 cluster 随机取 1 个候选点。
 *   cluster = 路线上的一步，内含 N 个候选点位。
 *   一个已确认的点位是一个「约束」：它会淘汰承载不了它的路线，
 *   并锁定它所在的 cluster。约束之间无序，链上任意一点都可以确认。
 *
 * 已确认点位用 objectName 标识（同一图层内唯一；显示名不唯一）。
 */

/** 世界坐标 → 底图归一化坐标（0~1，左上为原点） */
export function projectPoint(layer, x, y) {
  const c = layer.corners || []
  if (c.length < 2) return { u: 0.5, v: 0.5 }
  const minX = Math.min(c[0][0], c[1][0])
  const maxX = Math.max(c[0][0], c[1][0])
  const minY = Math.min(c[0][1], c[1][1])
  const maxY = Math.max(c[0][1], c[1][1])
  const du = maxX - minX || 1
  const dv = maxY - minY || 1
  return { u: (x - minX) / du, v: (y - minY) / dv }
}

/** 递归枚举简单路径的上限，防止异常图层爆栈 */
const MAX_ROUTES = 3000

/**
 * 把图层解析成路线集合。
 * @returns {{routes: Array<{lane: string, steps: Array<{cluster: string, ids: string[], pts: object[]}>}>,
 *            truncated: boolean, stepCount: number, laneNames: string[]}}
 */
export function buildRoutes(layer) {
  const nodes = layer.nodes || {}
  const laneLinks = layer.laneLinks || {}
  const routes = []
  let truncated = false

  const enumerate = (links, laneName) => {
    const adjacency = new Map()
    const incoming = new Set()
    const outgoing = new Set()
    for (const [a, b] of links) {
      if (!adjacency.has(a)) adjacency.set(a, [])
      adjacency.get(a).push(b)
      outgoing.add(a)
      incoming.add(b)
    }
    if (!adjacency.size) return
    const all = new Set([...outgoing, ...incoming])
    const start = [...all].find((n) => !incoming.has(n))
    const end = [...all].find((n) => !outgoing.has(n))
    if (!start || !end) return

    const found = []
    const walk = (node, trail) => {
      if (found.length >= MAX_ROUTES) { truncated = true; return }
      if (node === end) { found.push(trail.slice()); return }
      for (const next of adjacency.get(node) || []) {
        if (trail.includes(next)) continue
        trail.push(next)
        walk(next, trail)
        trail.pop()
        if (truncated) return
      }
    }
    walk(start, [start])

    // 主基地不承载候选点，剔除
    found.forEach((path) => {
      const steps = path
        .map((n) => nodes[n])
        .filter((o) => o && o.pts && o.pts.length)
        .map((o) => ({
          cluster: o.name || (o.pts[0] && o.pts[0].id) || '',
          ids: o.pts.map((p) => p.id),
          pts: o.pts,
          x: o.x,
          y: o.y,
        }))
      if (steps.length) routes.push({ lane: laneName, steps })
    })
  }

  const named = Object.keys(laneLinks).filter((k) => k !== '_')
  if (named.length) {
    named.forEach((name) => enumerate(laneLinks[name], name))
  } else {
    const flat = laneLinks['_'] || []
    enumerate(flat, '')
  }

  // 单链图层没有 lane 名：按路线在链上的先后用 A/B/C... 标注
  const unlabeled = routes.filter((r) => !r.lane)
  if (unlabeled.length === routes.length) {
    routes.forEach((r, i) => { r.lane = String.fromCharCode(65 + (i % 26)) })
  } else {
    unlabeled.forEach((r, i) => { r.lane = r.lane || `L${i + 1}` })
  }

  const laneNames = [...new Set(routes.map((r) => r.lane))]
  const stepCount = routes.length ? Math.max(...routes.map((r) => r.steps.length)) : 0
  return { routes, truncated, stepCount, laneNames }
}

/**
 * 按已知点位求解：还有多少条路线活着、每个点位可能出现在第几步、概率多少。
 *
 * @param {Array} routes  buildRoutes 的产物
 * @param {Array<{ids: string[], step?: number|null}>} constraints 已确认点位
 * @returns {{alive:number,total:number,byId:Map,steps:Map,impossible:boolean,survivors:Array}}
 */
export function solveRoutes(routes, constraints = []) {
  const survivors = []

  routes.forEach((route, routeIndex) => {
    const locks = new Map()
    const hitsPerConstraint = []
    let viable = true

    for (const cst of constraints) {
      const pinned = cst.step ?? null
      const hits = []
      route.steps.forEach((step, index) => {
        if (pinned !== null && index + 1 !== pinned) return
        const overlap = step.ids.filter((id) => cst.ids.includes(id))
        if (overlap.length) hits.push({ index, overlap })
      })
      if (!hits.length) { viable = false; break }
      if (hits.length === 1 && hits[0].overlap.length === 1) {
        const { index, overlap } = hits[0]
        if (locks.has(index) && locks.get(index) !== overlap[0]) { viable = false; break }
        locks.set(index, overlap[0])
      }
      hitsPerConstraint.push(hits.map((h) => h.index))
    }

    // 两个点位不能落在同一格
    if (viable) {
      for (let a = 0; a < hitsPerConstraint.length && viable; a++) {
        if (hitsPerConstraint[a].length !== 1) continue
        for (let b = a + 1; b < hitsPerConstraint.length; b++) {
          if (hitsPerConstraint[b].length !== 1) continue
          if (hitsPerConstraint[a][0] === hitsPerConstraint[b][0]) { viable = false; break }
        }
      }
    }

    if (viable) survivors.push({ route, locks, routeIndex })
  })

  const steps = new Map()
  const byId = new Map()
  const weight = survivors.length ? 1 / survivors.length : 0

  survivors.forEach(({ route, locks, routeIndex }) => {
    route.steps.forEach((step, index) => {
      const ids = locks.has(index) ? [locks.get(index)] : step.ids
      const share = weight / ids.length
      const stepNo = index + 1
      if (!steps.has(stepNo)) steps.set(stepNo, new Map())
      const at = steps.get(stepNo)
      ids.forEach((id) => {
        at.set(id, (at.get(id) || 0) + share)
        let e = byId.get(id)
        if (!e) { e = { probability: 0, steps: new Set(), lanes: new Set() }; byId.set(id, e) }
        e.probability += share
        e.steps.add(stepNo)
        e.lanes.add(routeIndex)
      })
    })
  })

  return {
    alive: survivors.length,
    total: routes.length,
    survivors,
    steps,
    byId,
    impossible: constraints.length > 0 && survivors.length === 0,
  }
}

/** 图层里所有候选点位（扁平） */
export function allPoints(layer) {
  const out = []
  Object.entries(layer.nodes || {}).forEach(([cluster, o]) => {
    (o.pts || []).forEach((p) => out.push({ ...p, cluster }))
  })
  return out
}

/** 方便查 id → 点位 */
export function pointIndex(layer) {
  const map = new Map()
  Object.entries(layer.nodes || {}).forEach(([cluster, o]) => {
    (o.pts || []).forEach((p) => map.set(p.id, { ...p, cluster }))
  })
  return map
}

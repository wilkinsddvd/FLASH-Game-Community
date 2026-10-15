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

/** 主基地节点在国际惯例里的显示名 */
export const BASE_LABEL_START = '出生点'
export const BASE_LABEL_END = '终点'

/** cluster 节点键 → 短名（去掉 CaptureZoneCluster 后缀） */
export function clusterShort(key) {
  return (key || '')
    .replace(/-?BP_CaptureZoneCluster$/, '')
    .replace(/-?CaptureZoneCluster$/, '')
    .replace(/-+$/, '')
}

/** 驼峰拆空格，但保留 HVT / NE / ATC 这类缩写与已有的空格、连字符 */
export function prettifyName(name) {
  return (name || '')
    .replace(/([a-z0-9])(?=[A-Z])/g, '$1 ')
    .replace(/([A-Z]+)(?=[A-Z][a-z])/g, '$1 ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * 点位显示名：
 *   1) 先剥离所属 cluster 的前缀（覆盖 `A1-NorthOrchard`、无连字符的 `A1Checkpoint`）
 *   2) 兜底剥离开头短 token（覆盖 `03-Al-Zawahiri Compound`、跨组挂靠的 `B3-Chernikov Central`）
 *   3) 驼峰拆空格
 * ⚠️ 只影响显示，内部一律仍用原 id
 */
export function displayName(cluster, name) {
  const raw = name || ''
  if (raw === BASE_LABEL_START || raw === BASE_LABEL_END) return raw
  const s = clusterShort(cluster)
  if (s && raw.startsWith(s)) {
    const rest = raw.slice(s.length).replace(/^[-_ ]+/, '')
    if (rest) return prettifyName(rest)
  }
  const m = raw.match(/^([A-Za-z]{0,2}\d{1,3})[-_ ]+(.+)$/)
  return prettifyName(m ? m[2] : raw)
}

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

/** 递归枚举简单路径的上限，防止异常图层爆栈（双向会翻倍，所以给足） */
const MAX_ROUTES = 6000

/**
 * 把图层解析成路线集合。
 *
 * ⚠️ 游戏里 lane 是**双向**的：同一条主基地→主基地的链，从哪一端作为第 0 步
 * 取决于你的出生点。所以默认 `bidirectional: true`，同一条 lane 会生成
 * 「正向 + 反向」两条路线（`dir: 'fwd' | 'rev'`），反向时 steps 整体倒序。
 * 这样「选定出生点」只需一条约束 `{ids:[spawnId]}` 就能把方向过滤掉
 * （每条路线的 steps 只含自己那一端的主基地）。
 *
 * @param {object} layer
 * @param {{bidirectional?: boolean}} [opts]
 * @returns {{routes: Array<{lane: string, dir: 'fwd'|'rev',
 *            steps: Array<{cluster: string, ids: string[], pts: object[]}>}>,
 *            truncated: boolean, stepCount: number, laneNames: string[]}}
 */
export function buildRoutes(layer, opts = {}) {
  const bidirectional = opts.bidirectional !== false
  const nodes = layer.nodes || {}
  const laneLinks = layer.laneLinks || {}
  const routes = []
  let truncated = false

  // ⚠️ 少数图层（Mestia / Sumari）laneLinks 的键带空格而 nodes 的键不带，
  // 做一次「忽略空格」的兑底查找。
  const nodeByKey = new Map()
  Object.keys(nodes).forEach((k) => {
    nodeByKey.set(k, k)
    const squash = k.replace(/\s+/g, '')
    if (!nodeByKey.has(squash)) nodeByKey.set(squash, k)
  })
  const pickNode = (key) => {
    const hit = nodeByKey.get(key) ?? nodeByKey.get((key || '').replace(/\s+/g, ''))
    return hit ? { key: hit, node: nodes[hit] } : null
  }

  /** dir='rev' 时把 links 反向，起点即原来那条 lane 的终点主基地 */
  const enumerate = (links, laneName, dir = 'fwd', assignLane = null) => {
    const use = dir === 'rev' ? links.map(([a, b]) => [b, a]) : links
    const adjacency = new Map()
    const incoming = new Set()
    const outgoing = new Set()
    for (const [a, b] of use) {
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

    found.forEach((path, pi) => {
      const steps = []
      path.forEach((nodeKey, i) => {
        const hit = pickNode(nodeKey)
        if (!hit) return
        const { key: ckey, node: o } = hit
        // 起点主基地（出生点）作为「第 0 步」纳入序列；终点主基地只作标记，不进步骤
        if (o.main) {
          if (i === 0) {
            steps.push({
              base: true,
              cluster: ckey,
              ids: [ckey],
              pts: [{ id: ckey, n: BASE_LABEL_START, x: o.x, y: o.y, r: 0, base: 'start' }],
              x: o.x,
              y: o.y,
            })
          }
          return
        }
        if (!o.pts || !o.pts.length) return
        steps.push({
          cluster: ckey,
          ids: o.pts.map((p) => p.id),
          pts: o.pts,
          x: o.x,
          y: o.y,
        })
      })
      if (steps.length) routes.push({ lane: assignLane ? assignLane(pi) : laneName, dir, steps })
    })
  }

  const named = Object.keys(laneLinks).filter((k) => k !== '_')
  if (named.length) {
    named.forEach((name) => {
      enumerate(laneLinks[name], name, 'fwd')
      if (bidirectional) enumerate(laneLinks[name], name, 'rev')
    })
  } else {
    // 单链图层没有 lane 名：正/反两个方向按同一条链的先后共用 A/B/C... 名
    const flat = laneLinks['_'] || []
    const letter = (i) => String.fromCharCode(65 + (i % 26))
    enumerate(flat, '', 'fwd', letter)
    if (bidirectional) enumerate(flat, '', 'rev', letter)
  }

  routes.forEach((r, i) => { if (!r.lane) r.lane = String.fromCharCode(65 + (i % 26)) })

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

/** 起点主基地 id（= 第一条路线第 0 步的 id） */
export function startBaseId(routes) {
  const r = routes && routes[0]
  return r && r.steps[0] && r.steps[0].base ? r.steps[0].ids[0] : null
}

/** 所有可选的出生点 id（= 各路线第 0 步的主基地；双向图层通常 2 个） */
export function spawnIds(routes) {
  const out = new Set()
  ;(routes || []).forEach((r) => {
    const s = r.steps[0]
    if (s && s.base) out.add(s.ids[0])
  })
  return out
}

/** 不同 lane 的条数（双向只算一条） */
export function laneCount(routes) {
  return new Set((routes || []).map((r) => r.lane)).size
}

/** 图层里所有候选点位（扁平，含主基地） */
export function allPoints(layer) {
  const out = []
  Object.entries(layer.nodes || {}).forEach(([cluster, o]) => {
    if (o.main) {
      out.push({ id: cluster, n: cluster, x: o.x, y: o.y, r: 0, cluster, base: true })
      return
    }
    (o.pts || []).forEach((p) => out.push({ ...p, cluster }))
  })
  return out
}

/**
 * 方便查 id → 点位（含主基地）。
 * @param {string|null} [spawnId] 你的出生点：给了就分出生点/终点；没给则两个主基地都叫「出生点」（待你选）
 */
export function pointIndex(layer, routes, spawnId = null) {
  const map = new Map()
  Object.entries(layer.nodes || {}).forEach(([cluster, o]) => {
    if (o.main) {
      const name = !spawnId || cluster === spawnId ? BASE_LABEL_START : BASE_LABEL_END
      map.set(cluster, {
        id: cluster, cluster, x: o.x, y: o.y, r: 0, base: true, n: name,
      })
      return
    }
    (o.pts || []).forEach((p) => map.set(p.id, { ...p, cluster }))
  })
  return map
}

/**
 * 顺序求解：每条存活路线上「已确认点位」的最深步 index。
 * 步 index 与 buildRoutes 的 steps 下标一致（0 = 出生点）。
 */
export function routeDepths(survivors, confirmedIds) {
  const depths = new Map()
  survivors.forEach(({ route, routeIndex }) => {
    let d = -1
    route.steps.forEach((s, idx) => {
      if (s.ids.some((id) => confirmedIds.includes(id))) d = Math.max(d, idx)
    })
    depths.set(routeIndex, d)
  })
  return depths
}

/** 每条存活路线上「已确认之后」仍可能刷新的点位 id（含更靠后的步） */
export function futureIds(survivors, depths) {
  const out = new Set()
  survivors.forEach(({ route, routeIndex }) => {
    const d = depths.get(routeIndex) ?? -1
    route.steps.forEach((s, idx) => {
      if (idx > d) s.ids.forEach((id) => out.add(id))
    })
  })
  return out
}

/** 下一步可点集合：各存活路线「下一格」的全部候选（多 lane 取并集） */
export function nextIds(survivors, depths) {
  const out = new Set()
  survivors.forEach(({ route, routeIndex }) => {
    const d = depths.get(routeIndex) ?? -1
    const step = route.steps[d + 1]
    if (step) step.ids.forEach((id) => out.add(id))
  })
  return out
}

/** 现在该点第几步（0 基，多 lane 取最早的那个）；没有可点的步则返回 null */
export function currentStepNo(survivors, depths) {
  let best = null
  survivors.forEach(({ route, routeIndex }) => {
    const d = depths.get(routeIndex) ?? -1
    if (d + 1 < route.steps.length) best = best === null ? d + 1 : Math.min(best, d + 1)
  })
  return best
}

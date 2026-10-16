/**
 * Squad 载具聚合统计（从生效的阵营编制数据里算，前端共享）
 *
 * 数据源：`factions.js` 的 80 个编制（含后台覆盖数据，走 remote.js）
 * 产出两张表：
 *   - byVehicle：一辆车一行（262 个名称口径，**不做异名归并**）
 *   - byFaction：一个阵营一块（类别分组 + 载具行 + 汇总）
 *
 * ⚠️ 异名整理（同物异名合并，如「M939运兵卡车」vs「M939 运兵卡车」）本轮先不做：
 *    归一入口就留在这一个函数 `vehicleKey()` 里，以后加别名表只改这里，页面不用动。
 * ⚠️ 同一名称在不同编制里票数/复活/数量可能不同 → 保留 variants，页面标注「不一致」。
 */
import { FACTIONS, VEHICLE_CATEGORIES } from './factions.js'

/** 聚合键：先按名称原样（异名整理以后加在这） */
export function vehicleKey(v) {
  return String(v.name || '').trim()
}

const numOrNull = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** 取数组里出现次数最多的值（并列取更小的），空数组 → null */
function mode(nums) {
  const arr = nums.filter((n) => n !== null)
  if (!arr.length) return null
  const cnt = new Map()
  arr.forEach((n) => cnt.set(n, (cnt.get(n) || 0) + 1))
  return [...cnt.entries()]
    .sort((a, b) => (b[1] - a[1]) || (a[0] - b[0]))[0][0]
}

/** 数值列表 → { value: 众数, variants: 去重升序 } */
function summarize(nums) {
  const variants = [...new Set(nums.filter((n) => n !== null))].sort((a, b) => a - b)
  return { value: mode(nums), variants, mixed: variants.length > 1 }
}

const CAT_ORDER = ['tank', 'ifv', 'apc', 'light_attack', 'logistics', 'helicopter', 'artillery']
const catRank = (c) => {
  const i = CAT_ORDER.indexOf(c)
  return i === -1 ? CAT_ORDER.length : i
}

/** 类别显示信息（缺的类别给个兜底） */
export function categoryMeta(categories, key) {
  return categories?.[key] || VEHICLE_CATEGORIES[key] || { label: key || '其他', icon: '🚗' }
}

/**
 * @param {Array} factions 阵营数组（静态底稿或后台覆盖数据）
 * @param {Object} categories 类别字典
 */
export function buildVehicleStats(factions = FACTIONS, categories = VEHICLE_CATEGORIES) {
  const byKey = new Map()
  const facList = []

  for (const f of factions || []) {
    const fac = {
      code: f.code,
      name: f.name,
      flag_url: f.flag_url || '',
      theme: f.theme || '',
      intro: f.intro || '',
      rosterCount: (f.rosters || []).length,
      entryCount: 0,
      uniqueCount: 0,
      totalUnits: 0,
      byCat: new Map(),          // cat → Map(key → row)
      rosters: [],
    }
    for (const r of f.rosters || []) {
      const roster = {
        key: r.key,
        name: r.name,
        type: r.type,
        type_key: r.type_key,
        type_icon: r.type_icon,
        entryCount: 0,
        totalUnits: 0,
      }
      for (const v of r.vehicles || []) {
        const key = vehicleKey(v)
        if (!key) continue
        if (!byKey.has(key)) {
          byKey.set(key, {
            key,
            name: v.name,
            category: v.category || 'other',
            type: v.type || '',
            icon_url: v.icon_url || '',
            notes: new Set(),
            tickets: [],
            respawn: [],
            initialDelay: [],
            counts: [],
            entries: [],
            factions: new Set(),
            rosters: new Set(),
          })
        }
        const row = byKey.get(key)
        if (!row.icon_url && v.icon_url) row.icon_url = v.icon_url
        row.tickets.push(numOrNull(v.tickets))
        row.respawn.push(numOrNull(v.respawn_time))
        row.initialDelay.push(numOrNull(v.initial_delay))
        row.counts.push(numOrNull(v.count))
        if (v.note) row.notes.add(v.note)
        row.factions.add(f.code)
        row.rosters.add(f.code + '|' + r.key)
        row.entries.push({
          faction: f.code,
          factionName: f.name,
          rosterKey: r.key,
          rosterName: r.name,
          rosterType: r.type,
          count: numOrNull(v.count),
          tickets: numOrNull(v.tickets),
          respawn_time: numOrNull(v.respawn_time),
          initial_delay: numOrNull(v.initial_delay),
          note: v.note || '',
        })

        // 阵营视角
        if (!fac.byCat.has(row.category)) fac.byCat.set(row.category, new Map())
        fac.byCat.get(row.category).set(key, row)
        fac.entryCount++
        fac.totalUnits += numOrNull(v.count) || 0
        roster.entryCount++
        roster.totalUnits += numOrNull(v.count) || 0
      }
      fac.rosters.push(roster)
    }
    fac.uniqueCount = [...fac.byCat.values()].reduce((s, m) => s + m.size, 0)
    facList.push(fac)
  }

  // ── 载具维度表 ──
  const byVehicle = [...byKey.values()].map((row) => {
    const tickets = summarize(row.tickets)
    const respawn = summarize(row.respawn)
    const initialDelay = summarize(row.initialDelay)
    const count = summarize(row.counts)
    return {
      key: row.key,
      name: row.name,
      category: row.category,
      catLabel: categoryMeta(categories, row.category).label,
      catIcon: categoryMeta(categories, row.category).icon,
      type: row.type,
      icon_url: row.icon_url,
      notes: [...row.notes],
      tickets: tickets.value,
      ticketsVariants: tickets.variants,
      ticketsMixed: tickets.mixed,
      respawn_time: respawn.value,
      respawnVariants: respawn.variants,
      respawnMixed: respawn.mixed,
      initial_delay: initialDelay.value,
      initialVariants: initialDelay.variants,
      count: count.value,
      countVariants: count.variants,
      countMixed: count.mixed,
      totalUnits: row.counts.reduce((s, n) => s + (n || 0), 0),
      entryCount: row.entries.length,
      factionCount: row.factions.size,
      rosterCount: row.rosters.size,
      factions: [...row.factions],
      entries: row.entries,
    }
  })
  byVehicle.sort((a, b) => (catRank(a.category) - catRank(b.category))
    || (b.totalUnits - a.totalUnits)
    || a.name.localeCompare(b.name, 'zh-Hans-CN'))

  // ── 阵营维度表 ──
  const byFaction = facList.map((fac) => {
    const catRows = [...fac.byCat.entries()]
      .sort((a, b) => catRank(a[0]) - catRank(b[0]))
      .map(([cat, map]) => {
        const items = [...map.values()].map((row) => {
          // 该阵营下的条目（同一辆车在多个编制里可能有多条）
          const mine = row.entries.filter((e) => e.faction === fac.code)
          const count = summarize(mine.map((e) => e.count))
          const tickets = summarize(mine.map((e) => e.tickets))
          const respawn = summarize(mine.map((e) => e.respawn_time))
          return {
            key: row.key,
            name: row.name,
            type: row.type,
            icon_url: row.icon_url,
            category: row.category,
            count: count.value,
            countVariants: count.variants,
            tickets: tickets.value,
            ticketsVariants: tickets.variants,
            respawn_time: respawn.value,
            respawnVariants: respawn.variants,
            units: mine.reduce((s, e) => s + (e.count || 0), 0),
            rosters: mine.map((e) => e.rosterName),
            entries: mine,
          }
        }).sort((a, b) => (b.units - a.units) || a.name.localeCompare(b.name, 'zh-Hans-CN'))
        const meta = categoryMeta(categories, cat)
        return {
          key: cat,
          label: meta.label,
          icon: meta.icon,
          items,
          units: items.reduce((s, it) => s + it.units, 0),
        }
      })
    return {
      ...fac,
      byCat: undefined,
      categories: catRows,
      uniqueCount: fac.uniqueCount,
    }
  })

  // ── 全局汇总 ──
  const byCategory = {}
  for (const v of byVehicle) {
    if (!byCategory[v.category]) byCategory[v.category] = { key: v.category, entries: 0, unique: 0, totalUnits: 0 }
    byCategory[v.category].entries += v.entryCount
    byCategory[v.category].unique += 1
    byCategory[v.category].totalUnits += v.totalUnits
  }
  const categoryList = Object.values(byCategory)
    .map((c) => ({ ...c, ...categoryMeta(categories, c.key) }))
    .sort((a, b) => catRank(a.key) - catRank(b.key))

  return {
    byVehicle,
    byFaction,
    categories: categoryList,
    totals: {
      factions: byFaction.length,
      rosters: byFaction.reduce((s, f) => s + f.rosterCount, 0),
      entries: byVehicle.reduce((s, v) => s + v.entryCount, 0),
      uniqueVehicles: byVehicle.length,
      totalUnits: byVehicle.reduce((s, v) => s + v.totalUnits, 0),
      mixedVehicles: byVehicle.filter((v) => v.ticketsMixed || v.respawnMixed || v.countMixed).length,
    },
  }
}

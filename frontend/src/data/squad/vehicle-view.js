/**
 * 载具页面视图数据：按阵营聚合，保留每个编制的原始票数/复活值。
 *
 * 与 vehicle-stats.js 的区别：
 * - vehicle-stats.js 是「按载具」口径，票数/复活会取众数（其他地方还在用）
 * - 本文件专供新版载具页：同一阵营内按载具名合并卡片，但 entries 保留全部编制原始值
 */
import { classifyVehicle, VEHICLE_CLASS_ORDER } from './vehicle-class.js'
import { vehicleImageFor, isGenericOnly } from './vehicle-images.js'
import { canonicalKey, pickDisplayName } from './vehicle-name.js'

const numOrNull = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

function uniqueTicketRows(entries) {
  const rows = []
  const seen = new Set()
  for (const e of entries) {
    if (e.tickets === null) continue
    const key = `${e.rosterName}|${e.tickets}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({ roster: e.rosterName, tickets: e.tickets })
  }
  return rows
}

export function buildFactionCards(factions = []) {
  const facRows = []
  const globalKeys = new Set()
  let totalRosters = 0

  for (const f of factions || []) {
    const byKey = new Map()
    for (const r of f.rosters || []) {
      totalRosters++
      for (const v of r.vehicles || []) {
        const name = String(v.name || '').trim()
        if (!name) continue
        const key = canonicalKey(name)
        globalKeys.add(key)
        if (!byKey.has(key)) {
          byKey.set(key, {
            key,
            name,
            aliases: new Set([name]),
            type: v.type || '',
            category: v.category || '',
            icon_url: '',
            fallbackIcon: v.icon_url || '',
            notes: new Set(),
            entries: [],
          })
        }
        const card = byKey.get(key)
        card.aliases.add(name)
        if (!card.fallbackIcon && v.icon_url) card.fallbackIcon = v.icon_url
        if (v.note) card.notes.add(v.note)
        card.entries.push({
          sourceName: name,
          rosterKey: r.key,
          rosterName: r.name,
          rosterType: r.type || '',
          tickets: numOrNull(v.tickets),
          respawn_time: numOrNull(v.respawn_time),
          initial_delay: numOrNull(v.initial_delay),
          count: numOrNull(v.count),
          note: v.note || '',
        })
      }
    }

    const cards = [...byKey.values()].map((card) => {
      const displayName = pickDisplayName(card.aliases)
      const iconUrl = isGenericOnly(displayName)
        ? ''
        : (vehicleImageFor(displayName) || card.fallbackIcon || '')
      const cls = classifyVehicle(displayName, f.code, card.type, card.category)
      const tickets = [...new Set(card.entries.map((e) => e.tickets).filter((x) => x !== null))]
      const ticketRows = uniqueTicketRows(card.entries)
      return {
        ...card,
        name: displayName,
        aliases: [...card.aliases],
        icon_url: iconUrl,
        notes: [...card.notes],
        cls,
        clsIcon: cls ? undefined : undefined,
        tickets,
        ticketRows,
        ticketsUniform: tickets.length <= 1,
        uniformTicket: tickets.length === 1 ? tickets[0] : null,
        ticketLines: ticketRows,
        rosterModels: card.entries.length,
      }
    })

    const groups = VEHICLE_CLASS_ORDER
      .map((cls) => ({ cls, cards: cards.filter((c) => c.cls === cls) }))
      .filter((g) => g.cards.length)
    const unclassified = cards.filter((c) => !c.cls)
    if (unclassified.length) groups.push({ cls: '', cards: unclassified })

    facRows.push({
      code: f.code,
      name: f.name,
      flag_url: f.flag_url || '',
      theme: f.theme || '',
      rosterCount: (f.rosters || []).length,
      modelCount: cards.length,
      cards,
      groups,
    })
  }

  return {
    factions: facRows,
    totals: {
      factions: facRows.length,
      rosters: totalRosters,
      models: globalKeys.size,
      cards: facRows.reduce((s, f) => s + f.cards.length, 0),
    },
  }
}

export function classOrderIndex(cls) {
  if (!cls) return VEHICLE_CLASS_ORDER.length + 1
  const i = VEHICLE_CLASS_ORDER.indexOf(cls)
  return i === -1 ? VEHICLE_CLASS_ORDER.length : i
}

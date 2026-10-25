/**
 * 英文词典漏译门禁（S6b）
 *
 * 扫描范围：
 *   1. 数据词典 `data/squad/i18n-names.js`：17 阵营 / 79 编制 / 203 载具型号 / 25 载具类型 / 7 类别 / 7 编制类型
 *   2. 界面文案 `locales/zh-CN.js` vs `en-US.js`：key 必须一一对应，英文值不得含中文
 *
 * 用法：node scripts/lint-i18n.mjs
 * 结果：任何缺项 / 英文里残留中文 → 非 0 退出
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FACTIONS } from '../frontend/src/data/squad/factions.js'
import { canonicalKey } from '../frontend/src/data/squad/vehicle-name.js'
import {
  FACTION_EN, ROSTER_EN, ROSTER_TYPE_EN, VEHICLE_TYPE_EN, VEHICLE_CAT_EN, vehicleEnName,
} from '../frontend/src/data/squad/i18n-names.js'
import zhCN from '../frontend/src/locales/zh-CN.js'
import enUS from '../frontend/src/locales/en-US.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const API = process.env.LINT_API || 'http://localhost:8000/api/squad/public'

const CJK = /[\u4e00-\u9fff]/
let failed = 0
const fail = (label, items) => {
  if (!items.length) { console.log('  ✅ ' + label); return }
  failed += items.length
  console.log('  ❌ ' + label + '（缺/脏 ' + items.length + '）')
  for (const it of items.slice(0, 12)) console.log('      · ' + it)
  if (items.length > 12) console.log('      · …还有 ' + (items.length - 12) + ' 条')
}

/** 优先用线上覆盖数据，拿不到就回退静态 */
async function loadFactions() {
  try {
    const r = await fetch(API, { signal: AbortSignal.timeout(4000) })
    if (r.ok) {
      const d = await r.json()
      if (d && Array.isArray(d.factions) && d.factions.length) {
        console.log('数据源：后端覆盖（' + d.factions.length + ' 阵营）')
        return d.factions
      }
    }
  } catch { /* ignore */ }
  console.log('数据源：静态 factions.js（' + FACTIONS.length + ' 阵营）')
  return FACTIONS
}

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + '.' + k : k
    if (v && typeof v === 'object') flatten(v, key, out)
    else out[key] = v
  }
  return out
}

const factions = await loadFactions()

console.log('\n── 数据词典 ──')

const factions_ = factions.map((f) => f.code)
fail('阵营英文名 17/17', factions_.filter((c) => !FACTION_EN[c]))

const rosters = []
const vehNames = new Set()
const rTypes = new Set()
const vTypes = new Set()
const cats = new Set()
for (const f of factions) {
  for (const r of f.rosters || []) {
    rosters.push(r.key)
    if (r.type) rTypes.add(r.type)
    for (const v of r.vehicles || []) {
      if (v.name) vehNames.add(v.name)
      if (v.type) vTypes.add(v.type)
      if (v.category) cats.add(v.category)
    }
  }
}
fail('编制英文名（缺 ' + rosters.filter((k) => !ROSTER_EN[k]).length + '）'.replace('（缺 ', '（共 ' + rosters.length + '，缺 ') || '',
  rosters.filter((k) => !ROSTER_EN[k]))

const vehMissing = [...vehNames].filter((n) => !vehicleEnName(n))
fail('载具英文名（共 ' + [...new Set([...vehNames].map((n) => canonicalKey(n)))].length + ' 个规范型号，缺 ' + vehMissing.length + '）', vehMissing)
fail('载具类型英文名（共 ' + vTypes.size + '）', [...vTypes].filter((t) => !VEHICLE_TYPE_EN[t]))
fail('载具类别英文名（共 ' + cats.size + '）', [...cats].filter((c) => !VEHICLE_CAT_EN[c]))
fail('编制类型英文名（共 ' + rTypes.size + '）', [...rTypes].filter((t) => !ROSTER_TYPE_EN[t]))

const dirtyData = []
for (const [name, map] of [['FACTION_EN', FACTION_EN], ['ROSTER_EN', ROSTER_EN], ['ROSTER_TYPE_EN', ROSTER_TYPE_EN],
  ['VEHICLE_TYPE_EN', VEHICLE_TYPE_EN], ['VEHICLE_CAT_EN', VEHICLE_CAT_EN]]) {
  for (const [k, v] of Object.entries(map)) {
    if (CJK.test(String(v))) dirtyData.push(name + '[' + k + '] = ' + v)
  }
}
fail('英文值不含中文（数据词典）', dirtyData)

console.log('\n── 界面文案 ──')
const zhFlat = flatten(zhCN)
const enFlat = flatten(enUS)
const zhKeys = Object.keys(zhFlat)
const enKeys = Object.keys(enFlat)
fail('英文缺 key（共 ' + zhKeys.length + ' 条）', zhKeys.filter((k) => !(k in enFlat)))
fail('英文多出 key', enKeys.filter((k) => !(k in zhFlat)))
fail('英文值不含中文', enKeys.filter((k) => CJK.test(String(enFlat[k]))))

console.log('\n' + (failed ? '❌ 门禁未通过：' + failed + ' 项' : '✅ 门禁通过：数据词典与界面文案都没有漏译'))
process.exit(failed ? 1 : 0)

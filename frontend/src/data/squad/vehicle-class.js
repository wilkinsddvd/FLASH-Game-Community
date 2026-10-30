/**
 * 载具类别标签（15 类）
 *
 * 口径（2026-10-17 确认）：
 * - 每个载具最多两个标签：阵营标签 + 类别标签
 * - 类别只允许下面 15 个；无法准确归类的返回 null（页面只显示阵营标签）
 * - 特例：
 *   · 复活车 = 仅 WPMC 的 M113A3 机动支援载具
 *   · 运兵卡/运输型 = 非装甲轮式运兵车；补给卡 = 补给载具
 *
 * ⚠️ 现阶段先用「型号/名称规则 + 覆盖表」生成，P2 会用 Wiki 数据逐型号核对。
 */

export const VEHICLE_CLASS_ORDER = [
  '坦克',
  '履带式步战车',
  '轮式步战车',
  '履带式装甲运兵车',
  '轮式装甲运兵车',
  '突击炮',
  '火力支援车',
  '防空车',
  '侦察车',
  '非装甲轮式运兵车',
  '补给载具',
  '直升机',
  '摩托',
  '橡皮艇',
  '复活车',
]

export const VEHICLE_CLASS_META = {
  坦克: { icon: '🛡️' },
  履带式步战车: { icon: '🚜' },
  轮式步战车: { icon: '🚜' },
  履带式装甲运兵车: { icon: '🚐' },
  轮式装甲运兵车: { icon: '🚐' },
  突击炮: { icon: '💥' },
  火力支援车: { icon: '🎯' },
  防空车: { icon: '📡' },
  侦察车: { icon: '🔭' },
  非装甲轮式运兵车: { icon: '🚛' },
  补给载具: { icon: '📦' },
  直升机: { icon: '🚁' },
  摩托: { icon: '🏍️' },
  橡皮艇: { icon: '🛶' },
  复活车: { icon: '⚑' },
}

/** 阵营 + 名称 级覆盖（优先级最高） */
const ENTRY_OVERRIDES = {
  'WPMC|M113A3 机动支援载具': '复活车',
  'VDV|BTR-MDM': '履带式装甲运兵车',
  'BAF|FV432 L37A2 遥控武器站': '履带式装甲运兵车',
  'BAF|FV432 L111A1 遥控武器站': '履带式装甲运兵车',
  'BAF|FV432 L11A1': '履带式装甲运兵车',
  'BAF|FV432 L11A1遥控武器站': '履带式装甲运兵车',
  'BAF|FV432 L37A2遥控武器站': '履带式装甲运兵车',
  'CAF|LUVW 运兵载具': '非装甲轮式运兵车',
  'CAF|LUVW C6 机枪': '侦察车',
  'CAF|LUVW C6机枪': '侦察车',
  'ADF|PMV Mag58': '轮式装甲运兵车',
  'ADF|PMV 遥控武器站 M2': '轮式装甲运兵车',
  'AFU|BTR-4': '轮式步战车',
  'TLF|Cobra II M2': '轮式装甲运兵车',
  'TLF|Cobra II M2 遥控武器站': '轮式装甲运兵车',
  'TLF|Cobra II MG3': '轮式装甲运兵车',
  'CRF|轻型 FSV': '火力支援车',
  // M7A3 游戏内为 IFV（25mm 炮塔的 M113 变体），名称里的「侦察车」会误判成侦察车
  'USA|M7A3装甲侦察车': '履带式步战车',
  'USA|M7A3 装甲侦察车': '履带式步战车',
  'WPMC|护卫载具 运兵型': '非装甲轮式运兵车',
  'WPMC|护卫载具 M134 转轮机枪': '火力支援车',
  'WPMC|护卫载具 M134转轮机枪': '火力支援车',
}

/** 规范型号级覆盖（同型号默认类别；名称匹配不到的在这里兜底） */
const MODEL_OVERRIDES = {
  // 坦克
  M1A1: '坦克', M1A2: '坦克', 'T-72': '坦克', 'T-72A': '坦克', 'T-72B3': '坦克',
  'T-90': '坦克', 'T-90A': '坦克', 'T-62': '坦克', 'T-64': '坦克', 'T-64BM2': '坦克',
  'FV4034': '坦克', '豹2A6': '坦克', '豹2A6M': '坦克', ZTZ99A: '坦克',
  // 突击炮
  M1128: '突击炮', ZLT05: '突击炮', '2S25': '突击炮', '章鱼-SDM1': '突击炮',
  // 防空
  'BTR-ZD': '防空车',
  // 直升机
  'Mi-8': '直升机', 'UH-60': '直升机', 'UH-1': '直升机', 'CH-146': '直升机',
  SA330: '直升机', 'Z-8': '直升机', 'Z-9': '直升机',
  // 摩托
  四轮摩托车: '摩托',
  // 橡皮艇
  橡皮艇: '橡皮艇',
}

const clean = (s) => String(s || '').replace(/\s+/g, '').toUpperCase()

function isWheeled(n) {
  return /轮式|LAV|ZBL|BTR-82|BTR-80|M1126|M1128|ZSL|PARS|M1117|斯崔克|STRYKER|LUVW|MSVS|HX60|M939|CTM131|CSK131|TIGR|虎|萨菲尔|皮卡|KRAZ|BMC|卡玛兹|URAL/.test(n)
}

/**
 * @param {string} name 原始载具名
 * @param {string} faction 阵营 code
 * @param {string} type 原始类型
 * @param {string} category 原始类别
 * @returns {string|null} 15 类之一或 null
 */
export function classifyVehicle(name, faction, type = '', category = '') {
  const key = `${faction}|${name}`
  if (ENTRY_OVERRIDES[key]) return ENTRY_OVERRIDES[key]

  const n = clean(name)
  const t = String(type || '')

  if (/橡皮艇|冲锋舟/.test(n)) return '橡皮艇'
  if (/摩托|全地形/.test(n) && !/^M-?ATV/.test(n)) return '摩托'
  if (/(改装皮卡|皮卡).*补给|补给.*(改装皮卡|皮卡)/.test(n)) return '补给载具'

  if (category === 'helicopter' || /直升机|MI-8|UH-60|UH-1|CH-146|SA330|Z-8|Z-9/.test(n)) {
    return '直升机'
  }

  if (/防空|BTR-ZD|ZU-23|锉刀/.test(n)) return '防空车'

  if (/M1128|ZLT05|2S25|章鱼|突击炮/.test(n)) return '突击炮'

  // 明确型号（名称规则容易误判的）
  if (/^LAV-?25|^LAV-?6/.test(n)) return '轮式步战车'
  if (/郊狼/.test(n)) return '侦察车'
  if (/^CSK131/.test(n)) return /HJ8/.test(n) ? '火力支援车' : '侦察车'
  if (/^CTM131QJZ89$/.test(n)) return '非装甲轮式运兵车'

  if (category === 'tank' || /主战坦克|M1A1|M1A2|T-72|T-90|T-62|T-64|挑战者|豹2|FV4034|ZTZ99/.test(n)) {
    return '坦克'
  }

  // 间接火力/重火力平台
  if (/迫击炮|M1064|BM-21|火箭炮|榴弹炮|自行火炮/.test(n)) return '火力支援车'
  if (/陶|短号|SPG-9|AGS-17|M134|米尼岗|重机枪型|高举架/.test(n)) {
    if (/M1151|M-ATV|MATV|皮卡|技术|萨菲尔|虎|TIGR|KOZAK|BRDM/.test(n)) return '火力支援车'
  }
  if (/改装皮卡|技术车辆|技术车/.test(n)) return '火力支援车'

  // 步战车：先判履带/轮式
  if (/步兵战车|步战车|IFV|BMP|M2A3|FV510|ZBD|BMD|LAV[- ]?\d|LAVIII|ASLAV|LAV 6|ZBL/.test(n)) {
    if (isWheeled(n) || /LAV|ZBL/.test(n)) return '轮式步战车'
    return '履带式步战车'
  }

  // 装甲运兵车：先判履带/轮式
  if (/装甲运兵|装甲输送|装甲运输|M113|MT-LB|MTLB|BTR-D|AAVP|AAVC|ACV-15|M1126|BTR-80|ZSL|ZSD|PARS|M1117|TLAV/.test(n)) {
    if (/M113|MT-LB|MTLB|BTR-D|AAVP|AAVC|ACV-15|TLAV|ZSD|履带/.test(n)) return '履带式装甲运兵车'
    return '轮式装甲运兵车'
  }

  // 侦察/巡逻/轻装甲突击
  if (/侦察|巡逻|M1151|M-ATV|MATV|TIGR|虎|LPPV|TAPV|BRDM|郊狼|KOZAK|萨菲尔/.test(n)) {
    return '侦察车'
  }

  // 非装甲运兵卡/运输车
  if (/运兵卡|运兵卡车|运输型|运输卡车|运输车/.test(n)) return '非装甲轮式运兵车'

  // 补给
  if (/补给/.test(n)) return '补给载具'

  // 兜底：型号覆盖表（精确 / 前缀）
  for (const [model, cls] of Object.entries(MODEL_OVERRIDES)) {
    const m = clean(model)
    if (n === m || n.startsWith(m)) return cls
  }

  return null
}

export function classIcon(cls) {
  return VEHICLE_CLASS_META[cls]?.icon || '🚗'
}

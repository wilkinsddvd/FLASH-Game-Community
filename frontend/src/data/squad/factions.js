/**
 * 《战术小队》阵营编制数据（静态数据层）
 * 字段定义遵循 需求文档（PRD）v1.0 的 JSON Schema
 *
 * ⚠️ 数据说明：
 * - 票数、复活时间等参数依据 Squad Wiki（squad.fandom.com）校对（2026-08 抓取）
 * - 编制类型共 7 种：合成营 / 机械化 / 装甲旅 / 轻步兵 / 空降 / 摩托化 / 支援
 * - 部分阵营天然缺失部分编制：IMF、MEI 缺失空降编制；PLA（陆军）缺失机械化编制
 * - 数据更新机制：每次游戏大版本更新后同步更新本文件
 * - 旗帜：有真实 PNG 的用 /squad-assets/flags/，无图片资源的新阵营用简化 SVG 占位
 */

/* ═══════════ SVG 生成工具 ═══════════ */

const svgDataUri = (body, w = 60, h = 40) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`
  )}`

/** 阵营旗帜（无真实 PNG 的阵营使用简化 SVG，60x40） */
const FLAGS = {
  USMC: svgDataUri(
    '<rect width="60" height="40" fill="#a6192e"/><circle cx="30" cy="20" r="12" fill="none" stroke="#c9a227" stroke-width="2.5"/><path d="M18 26 L42 26 L38 32 L22 32 Z" fill="#c9a227"/><path d="M24 26 v-6 a6 6 0 0 1 12 0 v6" fill="none" stroke="#c9a227" stroke-width="2"/>'
  ),
  USA: svgDataUri(
    '<rect width="60" height="40" fill="#b22234"/>' +
      Array.from({ length: 6 }, (_, i) => `<rect y="${3 + i * 6}" width="60" height="3" fill="#fff"/>`).join('') +
      '<rect width="26" height="22" fill="#3c3b6e"/><circle cx="5" cy="5" r="1.1" fill="#fff"/><circle cx="13" cy="5" r="1.1" fill="#fff"/><circle cx="21" cy="5" r="1.1" fill="#fff"/><circle cx="9" cy="11" r="1.1" fill="#fff"/><circle cx="17" cy="11" r="1.1" fill="#fff"/><circle cx="5" cy="17" r="1.1" fill="#fff"/><circle cx="13" cy="17" r="1.1" fill="#fff"/><circle cx="21" cy="17" r="1.1" fill="#fff"/>'
  ),
  RGF: svgDataUri(
    '<rect width="60" height="13.3" fill="#fff"/><rect y="13.3" width="60" height="13.3" fill="#0039a6"/><rect y="26.6" width="60" height="13.4" fill="#d52b1e"/>'
  ),
  BAF: svgDataUri(
    '<rect width="60" height="40" fill="#012169"/><path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0 L60 40 M60 0 L0 40" stroke="#c8102e" stroke-width="4"/><rect x="0" y="16" width="60" height="8" fill="#fff"/><rect x="0" y="18" width="60" height="4" fill="#c8102e"/><rect x="26" y="0" width="8" height="40" fill="#fff"/><rect x="28" y="0" width="4" height="40" fill="#c8102e"/>'
  ),
  CAF: svgDataUri(
    '<rect width="15" height="40" fill="#d52b1e"/><rect x="45" width="15" height="40" fill="#d52b1e"/><rect x="15" width="30" height="40" fill="#fff"/><path d="M30 8 l3.5 7 7 1 -5 5 1.5 7 -7 -3.5 -7 3.5 1.5 -7 -5 -5 7 -1 Z" fill="#d52b1e"/>'
  ),
  PLA: svgDataUri(
    '<rect width="60" height="40" fill="#de2910"/><path d="M14 6 l2.2 4.5 4.9 0.7 -3.5 3.4 0.8 4.9 -4.4 -2.3 -4.4 2.3 0.8 -4.9 -3.5 -3.4 4.9 -0.7 Z" fill="#ffde00"/><circle cx="22" cy="12" r="1" fill="#ffde00"/><circle cx="25" cy="16" r="0.8" fill="#ffde00"/><circle cx="27" cy="11" r="0.8" fill="#ffde00"/><circle cx="25" cy="8" r="0.8" fill="#ffde00"/>'
  ),
  ADF: svgDataUri(
    '<rect width="60" height="40" fill="#0a1f44"/><circle cx="30" cy="20" r="4" fill="#fff"/><circle cx="14" cy="8" r="1.4" fill="#fff"/><circle cx="42" cy="12" r="1.2" fill="#fff"/><circle cx="20" cy="30" r="1.2" fill="#fff"/><circle cx="46" cy="32" r="1.2" fill="#fff"/><path d="M30 20 l-5 -2 m5 2 l5 -2 m0 0 l-2 -3 m2 3 l-2 3" stroke="#fff" stroke-width="1.4" fill="none"/>'
  ),
  AFU: svgDataUri(
    '<rect width="60" height="40" fill="#0057b7"/><rect y="20" width="60" height="20" fill="#ffd700"/>'
  ),
  CRF: svgDataUri(
    '<rect width="60" height="40" fill="#151515"/><path d="M30 6 l3.5 7 7 1 -5 5 1.5 7 -7 -3.5 -7 3.5 1.5 -7 -5 -5 7 -1 Z" fill="#fff"/><line x1="30" y1="14" x2="30" y2="30" stroke="#d52b1e" stroke-width="2"/>'
  ),
  GFI: svgDataUri(
    '<rect width="60" height="13.3" fill="#239f40"/><rect y="13.3" width="60" height="13.3" fill="#fff"/><rect y="26.6" width="60" height="13.4" fill="#da0000"/><path d="M30 14 l1.6 3.2 3.6 0.5 -2.6 2.5 0.6 3.6 -3.2 -1.7 -3.2 1.7 0.6 -3.6 -2.6 -2.5 3.6 -0.5 Z" fill="#da0000"/>'
  ),
  IMF: svgDataUri(
    '<rect width="60" height="40" fill="#6b6b3c"/><path d="M30 6 L36 18 L48 19 L39 28 L42 40 L30 33 L18 40 L21 28 L12 19 L24 18 Z" fill="#1c1c10"/>'
  ),
  MEI: svgDataUri(
    '<rect width="60" height="40" fill="#151515"/><path d="M30 6 L40 34 L30 28 L20 34 Z" fill="#a6192e"/><path d="M12 8 h36 M12 14 h36 M12 20 h36 M12 26 h36 M12 32 h36" stroke="#3a3a3a" stroke-width="1.2"/>'
  ),
  PLAAGF: svgDataUri(
    '<rect width="60" height="40" fill="#de2910"/><path d="M14 6 l2.2 4.5 4.9 0.7 -3.5 3.4 0.8 4.9 -4.4 -2.3 -4.4 2.3 0.8 -4.9 -3.5 -3.4 4.9 -0.7 Z" fill="#ffde00"/><rect y="34" width="60" height="6" fill="#1e4f9e"/>'
  ),
  PLANMC: svgDataUri(
    '<rect width="60" height="40" fill="#1e4f9e"/><path d="M14 6 l2.2 4.5 4.9 0.7 -3.5 3.4 0.8 4.9 -4.4 -2.3 -4.4 2.3 0.8 -4.9 -3.5 -3.4 4.9 -0.7 Z" fill="#ffde00"/><rect y="34" width="60" height="6" fill="#de2910"/>'
  ),
  VDV: svgDataUri(
    '<rect width="60" height="40" fill="#2f7fbf"/><rect y="26" width="60" height="14" fill="#3c8a3c"/><circle cx="30" cy="12" r="4" fill="#ffd700"/><path d="M22 16 l8 6 8 -6 M22 22 l8 -6 8 6" stroke="#ffd700" stroke-width="1.8" fill="none"/><path d="M30 22 v10" stroke="#ffd700" stroke-width="1.8"/>'
  ),
  TLF: svgDataUri(
    '<rect width="60" height="40" fill="#e30a17"/><circle cx="27" cy="20" r="9" fill="#fff"/><circle cx="30" cy="20" r="7" fill="#e30a17"/><path d="M36 11 l1.6 3.4 3.7 0.5 -2.7 2.6 0.6 3.7 -3.2 -1.7 -3.2 1.7 0.6 -3.7 -2.7 -2.6 3.7 -0.5 Z" fill="#fff"/>'
  ),
  WPMC: svgDataUri(
    '<rect width="60" height="40" fill="#0d0d0d"/><circle cx="30" cy="20" r="10" fill="none" stroke="#e8e8e8" stroke-width="2"/><path d="M30 10 L34 17 L41 17 L35.5 22 L37.5 29 L30 25 L22.5 29 L24.5 22 L19 17 L26 17 Z" fill="#e8e8e8"/>'
  ),
}

/** NATO 风格编制图标（32x32 SVG data URI） */
const NATO_ICON = (type, color = '#9a9ab0') => {
  const C = color
  const shapes = {
    light_infantry:
      '<polygon points="16,3 29,16 16,29 3,16" fill="none" stroke="COLOR" stroke-width="2.5"/>',
    motorized:
      '<polygon points="16,3 29,16 16,29 3,16" fill="none" stroke="COLOR" stroke-width="2.5"/><circle cx="16" cy="16" r="3.6" fill="COLOR"/>',
    mechanized:
      '<polygon points="16,3 29,16 16,29 3,16" fill="none" stroke="COLOR" stroke-width="2.5"/><line x1="6" y1="16" x2="26" y2="16" stroke="COLOR" stroke-width="3"/>',
    armored:
      '<ellipse cx="16" cy="16" rx="12.5" ry="7.5" fill="none" stroke="COLOR" stroke-width="2.5"/><ellipse cx="16" cy="16" rx="12.5" ry="7.5" fill="COLOR" fill-opacity="0.2"/>',
    combined:
      '<polygon points="16,3 29,16 16,29 3,16" fill="none" stroke="COLOR" stroke-width="2.5"/><line x1="3" y1="3" x2="29" y2="29" stroke="COLOR" stroke-width="2"/><line x1="29" y1="3" x2="3" y2="29" stroke="COLOR" stroke-width="2"/>',
    airassault:
      '<circle cx="16" cy="8" r="5" fill="none" stroke="COLOR" stroke-width="2.5"/><path d="M9 10 l7 7 7 -7 M9 17 l7 -7 7 7" stroke="COLOR" stroke-width="1.8" fill="none"/><line x1="16" y1="17" x2="16" y2="27" stroke="COLOR" stroke-width="2.5"/><path d="M16 27 l-4 -4 M16 27 l4 -4" stroke="COLOR" stroke-width="2.5" fill="none"/>',
    support:
      '<rect x="4" y="8" width="24" height="16" fill="none" stroke="COLOR" stroke-width="2.5"/><line x1="4" y1="14" x2="28" y2="14" stroke="COLOR" stroke-width="1.5"/>',
  }
  const body = (shapes[type] || shapes.light_infantry).split('COLOR').join(C)
  return svgDataUri(body, 32, 32)
}

/* ═══════════ 单兵武器（各阵营标准步兵武器） ═══════════ */

/**
 * 单兵武器字段说明：
 * - name: 兵种/定位
 * - primary: 主武器
 * - secondary: 副武器/手枪
 * - note: 备注（可选）
 */
const SOLDIER_WEAPONS = {
  USMC: [
    { name: '步枪手', primary: 'M16A4', secondary: 'M9', note: '20发弹匣，三连发/全自动' },
    { name: '自动步枪手', primary: 'M27 IAR', secondary: 'M9', note: '班用轻机枪，两脚架' },
    { name: '精确射手', primary: 'M110 SASS', secondary: 'M9', note: '7.62mm半自动狙击' },
    { name: '通用机枪手', primary: 'M240B', secondary: 'M9', note: '7.62mm通用机枪' },
  ],
  USA: [
    { name: '步枪手', primary: 'M4A1', secondary: 'M9', note: '5.56mm卡宾枪' },
    { name: '自动步枪手', primary: 'M249 SAW', secondary: 'M9', note: '班用轻机枪' },
    { name: '精确射手', primary: 'M110 SASS', secondary: 'M9', note: '7.62mm半自动狙击' },
    { name: '通用机枪手', primary: 'M240B', secondary: 'M9', note: '7.62mm通用机枪' },
  ],
  RGF: [
    { name: '步枪手', primary: 'AK-74M', secondary: 'MP-443', note: '5.45mm突击步枪' },
    { name: '自动步枪手', primary: 'RPK-74M', secondary: 'MP-443', note: '班用轻机枪' },
    { name: '精确射手', primary: 'SVD', secondary: 'MP-443', note: '7.62mm半自动狙击' },
    { name: '通用机枪手', primary: 'PKM', secondary: 'MP-443', note: '7.62mm通用机枪' },
  ],
  VDV: [
    { name: '步枪手', primary: 'AK-12', secondary: 'MP-443', note: '现代化突击步枪，标配光学瞄具' },
    { name: '自动步枪手', primary: 'RPK-74M', secondary: 'MP-443', note: '班用轻机枪' },
    { name: '精确射手', primary: 'SV-98M', secondary: 'MP-443', note: '栓动狙击步枪' },
    { name: '通用机枪手', primary: 'PKP Pecheneg', secondary: 'MP-443', note: '7.62mm通用机枪' },
  ],
  BAF: [
    { name: '步枪手', primary: 'L85A2', secondary: 'L131A1', note: '5.56mm无托突击步枪' },
    { name: '自动步枪手', primary: 'L110A2', secondary: 'L131A1', note: 'Minimi班用机枪' },
    { name: '精确射手', primary: 'L129A1', secondary: 'L131A1', note: '7.62mm半自动狙击' },
    { name: '通用机枪手', primary: 'L7A2 GPMG', secondary: 'L131A1', note: '7.62mm通用机枪' },
  ],
  CAF: [
    { name: '步枪手', primary: 'C7A2', secondary: 'Browning HP', note: '5.56mm突击步枪' },
    { name: '自动步枪手', primary: 'C9A2', secondary: 'Browning HP', note: 'Minimi班用机枪' },
    { name: '精确射手', primary: 'C14 Timberwolf', secondary: 'Browning HP', note: '.338栓动狙击' },
    { name: '通用机枪手', primary: 'C6 GPMG', secondary: 'Browning HP', note: '7.62mm通用机枪' },
  ],
  ADF: [
    { name: '步枪手', primary: 'F88', secondary: 'Browning HP', note: 'Steyr AUG无托步枪' },
    { name: '自动步枪手', primary: 'F89 Minimi', secondary: 'Browning HP', note: '班用轻机枪' },
    { name: '精确射手', primary: 'SR-25', secondary: 'Browning HP', note: '7.62mm半自动狙击' },
    { name: '通用机枪手', primary: 'MAG 58', secondary: 'Browning HP', note: '7.62mm通用机枪' },
  ],
  AFU: [
    { name: '步枪手', primary: 'AK-74', secondary: 'PM', note: '5.45mm突击步枪' },
    { name: '步枪手(改)', primary: 'Malyuk 5.45/5.56/7.62', secondary: 'PM', note: '乌克兰无托改装步枪' },
    { name: '自动步枪手', primary: 'RPK-74', secondary: 'PM', note: '班用轻机枪' },
    { name: '精确射手', primary: 'SVD', secondary: 'PM', note: '7.62mm半自动狙击' },
    { name: '通用机枪手', primary: 'PKM', secondary: 'PM', note: '7.62mm通用机枪' },
  ],
  GFI: [
    { name: '步枪手', primary: 'G3A3', secondary: 'Hi-Power', note: '7.62mm战斗步枪' },
    { name: '步枪手(短)', primary: 'G3KA4 / KLS', secondary: 'Hi-Power', note: '卡宾型/AKM' },
    { name: '自动步枪手', primary: 'MG3', secondary: 'Hi-Power', note: '7.62mm通用机枪' },
    { name: '精确射手', primary: 'SVD', secondary: 'Hi-Power', note: '7.62mm半自动狙击' },
  ],
  IMF: [
    { name: '步枪手', primary: 'AKM', secondary: 'TT-33', note: '7.62mm突击步枪' },
    { name: '自动步枪手', primary: 'RPK', secondary: 'TT-33', note: '班用轻机枪' },
    { name: '精确射手', primary: 'SVD', secondary: 'TT-33', note: '7.62mm半自动狙击' },
    { name: '通用机枪手', primary: 'PKM', secondary: 'TT-33', note: '7.62mm通用机枪' },
  ],
  MEI: [
    { name: '步枪手', primary: 'AKM', secondary: 'TT-33', note: '7.62mm突击步枪' },
    { name: '自动步枪手', primary: 'RPK', secondary: 'TT-33', note: '班用轻机枪' },
    { name: '精确射手', primary: 'SVD', secondary: 'TT-33', note: '7.62mm半自动狙击' },
    { name: '通用机枪手', primary: 'PKM', secondary: 'TT-33', note: '7.62mm通用机枪' },
  ],
  PLA: [
    { name: '步枪手', primary: 'QBZ-95-1', secondary: 'QSZ-92', note: '5.8mm无托步枪' },
    { name: '自动步枪手', primary: 'QJB-95-1', secondary: 'QSZ-92', note: '班用轻机枪' },
    { name: '精确射手', primary: 'QBU-88', secondary: 'QSZ-92', note: '5.8mm半自动狙击' },
    { name: '通用机枪手', primary: 'QJY-88', secondary: 'QSZ-92', note: '5.8mm通用机枪' },
  ],
  PLAAGF: [
    { name: '步枪手', primary: 'QBZ-95-1', secondary: 'QSZ-92', note: '5.8mm无托步枪' },
    { name: '自动步枪手', primary: 'QJB-95-1', secondary: 'QSZ-92', note: '班用轻机枪' },
    { name: '精确射手', primary: 'QBU-88', secondary: 'QSZ-92', note: '5.8mm半自动狙击' },
    { name: '通用机枪手', primary: 'QJY-88', secondary: 'QSZ-92', note: '5.8mm通用机枪' },
  ],
  PLANMC: [
    { name: '步枪手', primary: 'QBZ-95-1', secondary: 'QSZ-92', note: '5.8mm无托步枪' },
    { name: '自动步枪手', primary: 'QJB-95-1', secondary: 'QSZ-92', note: '班用轻机枪' },
    { name: '精确射手', primary: 'QBU-88', secondary: 'QSZ-92', note: '5.8mm半自动狙击' },
    { name: '通用机枪手', primary: 'QJY-88', secondary: 'QSZ-92', note: '5.8mm通用机枪' },
  ],
  TLF: [
    { name: '步枪手', primary: 'MPT-76', secondary: 'G17', note: '7.62mm战斗步枪' },
    { name: '步枪手(短)', primary: 'MPT-55', secondary: 'G17', note: '5.56mm卡宾枪' },
    { name: '自动步枪手', primary: 'PKM', secondary: 'G17', note: '7.62mm通用机枪' },
    { name: '精确射手', primary: 'KNT-76', secondary: 'G17', note: '7.62mm半自动狙击' },
  ],
  WPMC: [
    { name: '步枪手', primary: 'M4', secondary: 'M9A1', note: '5.56mm卡宾枪' },
    { name: '步枪手(改)', primary: 'M4 Wormpool / AK-101', secondary: 'M9A1', note: '多种定制改型' },
    { name: '自动步枪手', primary: 'Minimi', secondary: 'M9A1', note: '班用轻机枪' },
    { name: '精确射手', primary: 'HK417 / M21', secondary: 'M9A1', note: '7.62mm半自动狙击' },
    { name: '通用机枪手', primary: 'M240B', secondary: 'M9A1', note: '7.62mm通用机枪' },
  ],
  CRF: [
    { name: '步枪手', primary: 'AR15 / C7A2', secondary: 'G17', note: '5.56mm卡宾枪' },
    { name: '步枪手(老式)', primary: 'Lee-Enfield No.4 / Mosin-Nagant', secondary: 'G17', note: '栓动老枪' },
    { name: '自动步枪手', primary: 'C9A2', secondary: 'G17', note: '班用轻机枪' },
    { name: '精确射手', primary: 'M21 / Timberwolf', secondary: 'G17', note: '半自动/栓动狙击' },
    { name: '通用机枪手', primary: 'C6', secondary: 'G17', note: '7.62mm通用机枪' },
  ],
}

/* ═══════════ 阵营数据 ═══════════ */

export const FACTIONS = [
  {
    code: 'USMC',
    name: '美国海军陆战队',
    flag_url: FLAGS.USMC,
    theme: '#b8860b', // 陆战队金
    soldier_weapons: SOLDIER_WEAPONS.USMC,
    rosters: [
      {
        key: 'usmc-mechanized',
        name: '机械化编制',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#b8860b'),
        description:
          '以步兵战车为核心的机械化步兵编制，具备较强的机动性和反载具能力，适合在开阔地形执行突击与突破任务。',
        tactics: {
          role: '正面突击 / 区域控制',
          strengths: ['载具火力强', '步兵与载具协同好', '具备两栖突击能力'],
          weaknesses: ['编制造价高，损失票数惩罚大', '对反载具火力较为敏感'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察', 'F/A-18近距空中支援'],
        vehicles: [
          { name: 'M2A3 Bradley', type: '步兵战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/usmc_m2a3.png', initial_delay: 600, note: '25mm机炮 + TOW反坦克导弹' },
          { name: 'M-ATV M2', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0, note: '12.7mm重机枪，快速侦察平台' },
          { name: 'UH-1Y Venom', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, initial_delay: 360, note: '可搭载完整步兵班快速投送' },
          { name: 'M939 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M939 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'M3 MAAWS', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹', '绷带x2'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'M110 SASS', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '榴弹兵', type: '火力支援', limit: 1, primary: 'M16A4 + M203', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '40mm高爆榴弹x6' },
        ],
      },
      {
        key: 'usmc-motorized',
        name: '摩托化编制',
        type: '摩托化',
        type_key: 'motorized',
        type_icon: NATO_ICON('motorized', '#b8860b'),
        description:
          '以轮式载具为主的快速反应编制，强调快速部署与巡逻控制，机动性极佳但装甲防护有限。',
        tactics: {
          role: '快速机动 / 侧翼包抄 / 巡逻',
          strengths: ['部署速度快', '载具成本低', '适合大面积地图控制'],
          weaknesses: ['装甲薄弱', '正面攻坚能力不足'],
        },
        commander_abilities: [
        'A-10"疣猪"空中打击力量',
        '155 毫米火炮压制弹幕射击',
        '155 毫米火炮徐进弹幕射击',
        'MQ-9 无人侦察机',
],
        vehicles: [
          { name: 'M939 运兵卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M939 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M1151（M2）', type: '轻型装甲车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m1151.png', initial_delay: 120 },
          { name: 'LAV-25 装甲侦察车', type: '轮式步战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/usmc_lav25.png', initial_delay: 300, note: '25mm机炮，机动火力兼备' },
          { name: 'M1A1 主战坦克', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/usmc_m1a1.png', initial_delay: 900, note: '120mm滑膛炮，全编制最强装甲' },
          { name: '（型号未识别）', type: '运输直升机', category: 'helicopter', count: 1, tickets: 0, respawn_time: 600, initial_delay: 0 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'M136 AT-4', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '一次性火箭筒' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'M110 SASS', secondary: 'M9', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
      {
        key: 'usmc-light',
        name: '轻步兵编制',
        type: '轻步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#b8860b'),
        description:
          '纯徒步步兵编制，无重型载具，依靠隐蔽机动与地形利用执行渗透和防御任务，票数风险最低。',
        tactics: {
          role: '渗透 / 侦察 / 防御',
          strengths: ['票数消耗低', '隐蔽性强', '适合城区与丛林作战'],
          weaknesses: ['无装甲支援', '机动依赖步行', '反载具能力有限'],
        },
        commander_abilities: ['无人机侦察'],
        vehicles: [
          { name: 'M939 运输卡车', type: '运输卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M939 补给卡车', type: '补给卡车', category: 'logistics', count: 1, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'M3 MAAWS', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 2, primary: 'M110 SASS', secondary: 'M9', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '工兵', type: '工程', limit: 2, primary: 'M16A4', secondary: 'M9', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'usmc-armored',
        name: '装甲旅编制',
        type: '装甲',
        type_key: 'armored',
        type_icon: NATO_ICON('armored', '#b8860b'),
        description:
          '以主战坦克为核心的重装甲编制，拥有最强的正面突破能力与装甲防护，是登陆场的钢铁矛头。',
        tactics: {
          role: '装甲突破 / 反装甲',
          strengths: ['火力与防护顶级', '心理威慑力强'],
          weaknesses: ['载具昂贵，损失惩罚极高', '步兵伴随不足', '地形适应性受限'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察', 'F/A-18近距空中支援'],
        vehicles: [
          { name: 'M1A1 Abrams', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/usmc_m1a1.png', initial_delay: 900, note: '120mm滑膛炮，全编制最强装甲' },
          { name: 'AAVP-7A1', type: '两栖装甲运兵车', category: 'apc', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/usmc_aavp.png', initial_delay: 240, note: '12.7mm重机枪，可两栖投送步兵' },
          { name: 'M-ATV M2', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'M939 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M939 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'M3 MAAWS', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'M16A4', secondary: 'M9', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'usmc-combined',
        name: '合成营编制',
        type: '合成',
        type_key: 'combined',
        type_icon: NATO_ICON('combined', '#b8860b'),
        description:
          '多兵种合成编制，坦克、步战车、直升机与步兵齐备，攻防兼备，可应对各类战场态势。',
        tactics: {
          role: '全频谱作战 / 战略预备队',
          strengths: ['兵种齐全', '战场适应性强', '独立作战能力高'],
          weaknesses: ['编制复杂度高', '后勤压力大', '整体损失惩罚高'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察', 'F/A-18近距空中支援'],
        vehicles: [
          { name: 'M1A1 Abrams', type: '主战坦克', category: 'tank', count: 1, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/usmc_m1a1.png', initial_delay: 900 },
          { name: 'M2A3 Bradley', type: '步兵战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/usmc_m2a3.png', initial_delay: 600 },
          { name: 'LAV-25', type: '轮式步战车', category: 'ifv', count: 1, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/usmc_lav25.png', initial_delay: 300 },
          { name: 'UH-1Y Venom', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, initial_delay: 360 },
          { name: 'M-ATV M2', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'M939 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'M3 MAAWS', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'M110 SASS', secondary: 'M9', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '工兵', type: '工程', limit: 2, primary: 'M16A4', secondary: 'M9', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
    ],
  },
  {
    code: 'USA',
    name: '美军陆军',
    flag_url: '/squad-assets/flags/usa.png',
    theme: '#4a7c2f', // 陆军绿
    soldier_weapons: SOLDIER_WEAPONS.USA,
    rosters: [
      {
        key: 'usa-mechanized',
        name: '机械化编制',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#4a7c2f'),
        description:
          '美陆军主力机械化旅，M2 布雷德利步战车与斯特赖克轮式装甲混编，火力投送与兵力输送兼顾。',
        tactics: {
          role: '正面突击 / 装甲协同',
          strengths: ['载具体系完整', '火控与信息化优势', '步兵伴随能力强'],
          weaknesses: ['高价值载具损失惩罚大', '依赖后勤补给'],
        },
        commander_abilities: [
        'A-10"疣猪"空中打击力量',
        '155 毫米火炮压制弹幕射击',
        '155 毫米火炮徐进弹幕射击',
        'MQ-9 无人侦察机',
],
        vehicles: [
          { name: 'M939 运兵卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M113A3 补给载具', type: '装甲运兵车', category: 'apc', count: 1, tickets: 5, respawn_time: 600, initial_delay: 240, note: '缴获老式装甲车' },
          { name: 'M113A3（M2）', type: '装甲运兵车', category: 'apc', count: 1, tickets: 5, respawn_time: 600, initial_delay: 240, note: '缴获老式装甲车' },
          { name: 'M113A3（Mk19）', type: '装甲运兵车', category: 'apc', count: 1, tickets: 5, respawn_time: 600, initial_delay: 240, note: '缴获老式装甲车' },
          { name: 'M1064A3 M121 迫击炮车', type: '火炮', category: 'artillery', count: 1, tickets: 5, initial_delay: 0 },
          { name: 'M2A3 步兵战车', type: '步兵战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/usmc_m2a3.png', initial_delay: 600 },
          { name: 'M1A2 主战坦克', type: '主战坦克', category: 'tank', count: 3, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/usmc_m1a1.png', initial_delay: 900, note: '120mm滑膛炮，车长独立热像仪' },
          { name: 'UH-60M 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 900, icon_url: '/squad-assets/vehicles/us_uh60.png', initial_delay: 360 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'M3 MAAWS', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹', '绷带x2'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'M110 SASS', secondary: 'M9', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '榴弹兵', type: '火力支援', limit: 1, primary: 'M4A1 + M320', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '40mm高爆榴弹x6' },
        ],
      },
      {
        key: 'usa-motorized',
        name: '摩托化编制',
        type: '摩托化',
        type_key: 'motorized',
        type_icon: NATO_ICON('motorized', '#4a7c2f'),
        description:
          '以斯特赖克与悍马车族为主的快速机动编制，依托公路网高速部署，适合机动作战与要点防御。',
        tactics: {
          role: '快速机动 / 要点防御',
          strengths: ['公路机动快', '信息化程度高', '部署灵活'],
          weaknesses: ['装甲防护一般', '正面攻坚能力有限'],
        },
        commander_abilities: [
        'A-10"疣猪"空中打击力量',
        '155 毫米火炮压制弹幕射击',
        '155 毫米火炮徐进弹幕射击',
        'MQ-9 无人侦察机',
],
        vehicles: [
          { name: 'M939 运兵卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M939 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M1126 遥控武器站（M240）', type: '轮式装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/us_m1126.png', initial_delay: 240 },
          { name: 'M1126（CROWS M2）', type: '轮式装甲运兵车', category: 'apc', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/us_m1126.png', initial_delay: 240 },
          { name: 'M1128 机动火炮系统', type: '火炮', category: 'artillery', count: 2, tickets: 10, initial_delay: 0 },
          { name: 'M1A2 主战坦克', type: '主战坦克', category: 'tank', count: 3, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/usmc_m1a1.png', initial_delay: 900, note: '120mm滑膛炮，车长独立热像仪' },
          { name: 'UH-60M 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/us_uh60.png', initial_delay: 360 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'M136 AT-4', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '一次性火箭筒' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'M110 SASS', secondary: 'M9', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
      {
        key: 'usa-armored',
        name: '装甲旅编制',
        type: '装甲',
        type_key: 'armored',
        type_icon: NATO_ICON('armored', '#4a7c2f'),
        description:
          '以 M1A2 艾布拉姆斯主战坦克为核心的重装甲旅，拥有顶级火力与防护，是地面突击的决定性力量。',
        tactics: {
          role: '装甲突击 / 反装甲',
          strengths: ['坦克火力与防护顶级', '信息化火控优势'],
          weaknesses: ['载具昂贵，损失惩罚极高', '后勤压力大', '城区机动受限'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察', 'A-10近距空中支援'],
        vehicles: [
          { name: 'M1A2 Abrams', type: '主战坦克', category: 'tank', count: 3, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/usmc_m1a1.png', initial_delay: 900, note: '120mm滑膛炮，车长独立热像仪' },
          { name: 'M2A3 Bradley', type: '步兵战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/usmc_m2a3.png', initial_delay: 600 },
          { name: 'M-ATV M2', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'M939 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M939 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'M3 MAAWS', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'M4A1', secondary: 'M9', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'usa-light',
        name: '轻步兵编制',
        type: '轻步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#4a7c2f'),
        description:
          '空中突击步兵编制，强调通过直升机与轻型载具快速投送，在敌后关键地域实施突袭与占领。',
        tactics: {
          role: '空中突击 / 敌后渗透',
          strengths: ['投送速度快', '适合复杂地形', '票数风险低'],
          weaknesses: ['缺乏重装甲', '持续作战能力有限'],
        },
        commander_abilities: [
        'A-10"疣猪"空中打击力量',
        '155 毫米火炮压制弹幕射击',
        '155 毫米火炮徐进弹幕射击',
        'MQ-9 无人侦察机',
],
        vehicles: [
          { name: '四轮摩托车', type: '运输卡车', category: 'logistics', count: 1, tickets: 0, initial_delay: 0 },
          { name: 'M939 运兵卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M939 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M-ATV（M240）', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'M-ATV（M2）', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'M-ATV（Mk19）', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'M-ATV（CROWS M2）', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'M-ATV M2HB"陶"', type: '侦察车', category: 'light_attack', count: 2, tickets: 10, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'M1A2 主战坦克', type: '主战坦克', category: 'tank', count: 3, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/usmc_m1a1.png', initial_delay: 900, note: '120mm滑膛炮，车长独立热像仪' },
          { name: 'UH-60M 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/us_uh60.png', initial_delay: 360 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'M136 AT-4', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '一次性火箭筒' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M249 SAW', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 2, primary: 'M110 SASS', secondary: 'M9', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
      {
        key: 'usa-airassault',
        name: '空降编制',
        type: '空降',
        type_key: 'airassault',
        type_icon: NATO_ICON('airassault', '#4a7c2f'),
        description:
          '空中突击编制，以直升机集群为主要投送手段，可快速夺取关键地形并建立前进据点。',
        tactics: {
          role: '空中突击 / 纵深机降',
          strengths: ['投送距离远', '出其不意', '适合夺点开局'],
          weaknesses: ['直升机损失风险高', '缺乏重火力伴随'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察', 'A-10近距空中支援'],
        vehicles: [
          { name: 'UH-60M Black Hawk', type: '运输直升机', category: 'helicopter', count: 3, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/us_uh60.png', initial_delay: 360, note: '主力机降平台' },
          { name: 'M-ATV M2', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'M939 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M939 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'M136 AT-4', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '一次性火箭筒' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'M110 SASS', secondary: 'M9', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
      {
        key: 'usa-support',
        name: '支援编制',
        type: '支援',
        type_key: 'support',
        type_icon: NATO_ICON('support', '#4a7c2f'),
        description:
          '以炮兵与后勤为核心的支援编制，提供远距离火力压制与持续补给，保障主力旅作战。',
        tactics: {
          role: '火力支援 / 后勤保障',
          strengths: ['远程火力强', '补给能力突出'],
          weaknesses: ['正面作战能力弱', '需要友军保护'],
        },
        commander_abilities: ['155mm炮兵连支援', '无人机侦察', '精确制导炮弹'],
        vehicles: [
          { name: 'M119 105mm牵引炮', type: '牵引火炮', category: 'artillery', count: 2, tickets: 15, respawn_time: 1200, initial_delay: 600, note: '远程火力压制核心' },
          { name: 'M939 补给卡车', type: '补给卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M939 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M-ATV M2', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'M4A1', secondary: 'M9', gear: ['破片手雷', '修理工具'], special: '弹药补给包' },
        ],
      },
    
      {
        key: 'usa-combined',
        name: '美国陆军第一步兵师',
        type: '合成',
        type_key: 'combined',
        type_icon: NATO_ICON('combined', '#4a7c2f'),
        description: '多兵种合成编制，坦克、步战车与直升机齐备，攻防兼备，可应对各类战场态势。',
        tactics: {
          role: '全频谱作战 / 战略预备队',
          strengths: ['兵种齐全', '战场适应性强', '独立作战能力高'],
          weaknesses: ['编制复杂度高', '后勤压力大', '整体损失惩罚高'],
        },
        commander_abilities: ['A-10"疣猪"空中打击力量', '155 毫米火炮压制弹幕射击', '155 毫米火炮徐进弹幕射击', 'MQ-9 无人侦察机'],
        vehicles: [
          { name: 'M939 运兵卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M939 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M-ATV（M2）', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'M-ATV（CROWS M2）', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'M1126（CROWS M2）', type: '轮式装甲运兵车', category: 'apc', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/us_m1126.png', initial_delay: 240 },
          { name: 'M2A3 步兵战车', type: '步兵战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/usmc_m2a3.png', initial_delay: 600 },
          { name: 'M1A2 主战坦克', type: '主战坦克', category: 'tank', count: 3, tickets: 15, respawn_time: 900, icon_url: '/squad-assets/vehicles/usmc_m1a1.png', initial_delay: 900, note: '120mm滑膛炮，车长独立热像仪' },
          { name: 'UH-60M 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_uh60.png', initial_delay: 360 },
        ],
        specialist_kits: [{"name": "重筒", "type": "反载具", "limit": 2, "primary": "M3 MAAWS", "secondary": "M9", "gear": ["2x 破片手雷", "烟雾弹", "绷带x2"], "special": "测距仪"}, {"name": "通用机枪", "type": "火力支援", "limit": 2, "primary": "M240B", "secondary": "M9", "gear": ["2x 破片手雷", "烟雾弹"], "special": "两脚架"}, {"name": "特射", "type": "侦察", "limit": 1, "primary": "M110 SASS", "secondary": "M9", "gear": ["2x 破片手雷", "测距仪"], "special": "可变倍率瞄准镜"}, {"name": "榴弹兵", "type": "火力支援", "limit": 1, "primary": "M4A1 + M320", "secondary": "M9", "gear": ["2x 破片手雷", "烟雾弹"], "special": "40mm高爆榴弹x6"}],
      },
],
  },
  {
    code: 'RGF',
    name: '俄军',
    flag_url: '/squad-assets/flags/rus.png',
    theme: '#d03a2f', // 俄军红
    soldier_weapons: SOLDIER_WEAPONS.RGF,
    rosters: [
      {
        key: 'rgf-mechanized',
        name: '机械化编制',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#d03a2f'),
        description:
          '以履带式装甲为核心的突击编制，火力与防护均衡，是正面战线的中坚力量。',
        tactics: {
          role: '正面突击 / 装甲突破',
          strengths: ['装甲防护优秀', '火力凶猛', '载具数量充足'],
          weaknesses: ['机动性一般', '高价值载具损失惩罚大'],
        },
        commander_abilities: ['152mm炮兵支援', '无人机侦察', '米-8直升机支援'],
        vehicles: [
          { name: 'BMP-2', type: '步兵战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/rus_bmp2.png', initial_delay: 480, note: '30mm机炮 + 反坦克导弹' },
          { name: 'BTR-82A', type: '轮式步战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/rus_btr82a.png', initial_delay: 300 },
          { name: 'Tigr-M', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/rus_tigr.png', initial_delay: 0 },
          { name: 'KamAZ-5350 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/rus_kamaz.png', initial_delay: 0 },
          { name: 'KamAZ-5350 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/rus_kamaz.png', initial_delay: 0 },
          { name: 'Mi-8MT', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/rus_mi8.png', initial_delay: 360 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'RPG-7V2', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹', '绷带x2'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'SVD', secondary: 'MP-443', gear: ['2x 破片手雷', '测距仪'], special: 'PSO-1瞄准镜' },
          { name: '榴弹兵', type: '火力支援', limit: 1, primary: 'AK-74M + GP-25', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹'], special: '40mm高爆榴弹x6' },
        ],
      },
      {
        key: 'rgf-motorized',
        name: '摩托化编制',
        type: '摩托化',
        type_key: 'motorized',
        type_icon: NATO_ICON('motorized', '#d03a2f'),
        description:
          '以轮式装甲车为主的快速机动编制，擅长利用公路网快速转移，遂行机动作战。',
        tactics: {
          role: '快速机动 / 纵深穿插',
          strengths: ['公路机动性极佳', '部署灵活', '载具成本适中'],
          weaknesses: ['越野机动受限', '防护弱于履带车辆'],
        },
        commander_abilities: [
        'SU-25"白嘴鸦"直线型对地打击',
        '152mm 压制型重炮火力支援',
        '152mm 徐进式重炮火力支援',
        'Pchela-1T 无人侦察机',
],
        vehicles: [
          { name: '卡玛兹 5320 运输卡车', type: '运输卡车', category: 'logistics', count: 1, tickets: 0, respawn_time: 360, initial_delay: 0 },
          { name: '卡玛兹 5320 补给卡车', type: '补给卡车', category: 'logistics', count: 1, tickets: 0, initial_delay: 0 },
          { name: '虎-M（Kord 重机枪型）', type: '装甲巡逻车', category: 'light_attack', count: 1, tickets: 5, initial_delay: 0 },
          { name: 'BTR-80 装甲运输车', type: '装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/rus_btr80.png', initial_delay: 180 },
          { name: 'BTR-82A 步兵战车', type: '轮式步战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/rus_btr82a.png', initial_delay: 300 },
          { name: 'T-90A 主战坦克', type: '主战坦克', category: 'tank', count: 1, tickets: 15, respawn_time: 1200, initial_delay: 0 },
          { name: '米-8 河马运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 0, respawn_time: 600, initial_delay: 0 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'RPG-7V2', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'SVD', secondary: 'MP-443', gear: ['2x 破片手雷', '测距仪'], special: 'PSO-1瞄准镜' },
        ],
      },
      {
        key: 'rgf-light',
        name: '轻步兵编制',
        type: '轻步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#d03a2f'),
        description:
          '以徒步步兵为主的轻装编制，擅长森林、城市等复杂地形作战，票数风险低。',
        tactics: {
          role: '城市战 / 丛林战 / 防御',
          strengths: ['隐蔽性好', '票数风险低', '地形适应性强'],
          weaknesses: ['无装甲支援', '机动依赖步行'],
        },
        commander_abilities: ['152mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'Tigr-M', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/rus_tigr.png', initial_delay: 0 },
          { name: 'KamAZ-5350 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/rus_kamaz.png', initial_delay: 0 },
          { name: 'Mi-8MT', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/rus_mi8.png', initial_delay: 360 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'RPG-7V2', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'RPK-74M', secondary: 'MP-443', gear: ['2x 破片手雷'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'SVD', secondary: 'MP-443', gear: ['2x 破片手雷', '测距仪'], special: 'PSO-1瞄准镜' },
        ],
      },
      {
        key: 'rgf-armored',
        name: '装甲旅编制',
        type: '装甲',
        type_key: 'armored',
        type_icon: NATO_ICON('armored', '#d03a2f'),
        description:
          '俄军近卫坦克部队，T-72 主战坦克集群冲击，强调高速装甲突击与大规模突破。',
        tactics: {
          role: '大规模装甲突击',
          strengths: ['坦克数量多', '冲击力强', '装甲防护可靠'],
          weaknesses: ['步兵协同弱', '损失惩罚极高', '消耗大'],
        },
        commander_abilities: ['152mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'T-72B3', type: '主战坦克', category: 'tank', count: 3, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/rus_t72.png', initial_delay: 900, note: '125mm滑膛炮，集群冲击' },
          { name: 'BMP-2', type: '步兵战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/rus_bmp2.png', initial_delay: 480 },
          { name: 'Tigr-M', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/rus_tigr.png', initial_delay: 0 },
          { name: 'KamAZ-5350 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/rus_kamaz.png', initial_delay: 0 },
          { name: 'KamAZ-5350 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/rus_kamaz.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'RPG-7V2', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'AK-74M', secondary: 'MP-443', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
    ],
  },
  {
    code: 'VDV',
    name: '俄罗斯空降军',
    flag_url: FLAGS.VDV,
    theme: '#2f7fbf', // 空降蓝
    soldier_weapons: SOLDIER_WEAPONS.VDV,
    rosters: [
      {
        key: 'vdv-airassault',
        name: '空降编制',
        type: '空降',
        type_key: 'airassault',
        type_icon: NATO_ICON('airassault', '#2f7fbf'),
        description:
          '俄军精锐空降部队，装备轻型化的 BMD 空降战车与 BTR-D 空降装甲车，擅长纵深空降突击。',
        tactics: {
          role: '空降突击 / 敌后破袭',
          strengths: ['战术素养高', '空降投送灵活', '轻型载具可空投'],
          weaknesses: ['装甲薄弱', '持续作战能力有限'],
        },
        commander_abilities: ['152mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'BMD-4M', type: '空降战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/rus_bmd4m.png', initial_delay: 420, note: '100mm炮，可空投' },
          { name: 'BTR-MDM', type: '空降装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, initial_delay: 240, note: '可搭载空降兵机降' },
          { name: 'Tigr-M', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/rus_tigr.png', initial_delay: 0 },
          { name: 'KamAZ-5350 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/rus_kamaz.png', initial_delay: 0 },
          { name: 'Mi-8MT', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/rus_mi8.png', initial_delay: 360 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'RPG-7V2', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKP Pecheneg', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'SV-98M', secondary: 'MP-443', gear: ['2x 破片手雷', '测距仪'], special: '高倍率瞄准镜' },
        ],
      },
      {
        key: 'vdv-mechanized',
        name: '机械化编制',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#2f7fbf'),
        description:
          '以 BMD-4M / BMD-1M 空降战车为核心的机械化空降编制，兼具空降能力与装甲突击力。',
        tactics: {
          role: '空降突击 / 装甲突破',
          strengths: ['载具可空投', '火力与机动均衡'],
          weaknesses: ['装甲防护一般', '后勤保障要求高'],
        },
        commander_abilities: ['152mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'BMD-4M', type: '空降战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/rus_bmd4m.png', initial_delay: 420 },
          { name: 'BMD-1M', type: '空降战车', category: 'ifv', count: 1, tickets: 10, respawn_time: 900, initial_delay: 420, note: '73mm炮，老式空降战车' },
          { name: 'BTR-ZD', type: '防空装甲车', category: 'apc', count: 1, tickets: 5, respawn_time: 600, initial_delay: 240, note: 'ZU-23双管高炮' },
          { name: 'Tigr-M', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/rus_tigr.png', initial_delay: 0 },
          { name: 'KamAZ-5350 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/rus_kamaz.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'RPG-7V2', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKP Pecheneg', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'AK-12', secondary: 'MP-443', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'vdv-armored',
        name: '装甲旅编制',
        type: '装甲',
        type_key: 'armored',
        type_icon: NATO_ICON('armored', '#2f7fbf'),
        description:
          'VDV 重装突击力量，T-72B3 坦克与 Sprut-SDM1 自行反坦克炮协同，具备独立装甲突破能力。',
        tactics: {
          role: '装甲突击 / 反装甲',
          strengths: ['坦克火力强', '空降军精锐素质'],
          weaknesses: ['载具昂贵', '损失惩罚高'],
        },
        commander_abilities: ['152mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'T-72B3', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/rus_t72.png', initial_delay: 900 },
          { name: 'Sprut-SDM1', type: '自行反坦克炮', category: 'tank', count: 1, tickets: 10, respawn_time: 900, initial_delay: 600, note: '125mm炮，可空投轻型坦克' },
          { name: 'BMD-4M', type: '空降战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/rus_bmd4m.png', initial_delay: 420 },
          { name: 'KamAZ-5350 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/rus_kamaz.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'RPG-7V2', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKP Pecheneg', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'AK-12', secondary: 'MP-443', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
    ],
  },
  {
    code: 'BAF',
    name: '英军',
    flag_url: '/squad-assets/flags/uk.png',
    theme: '#3a5f9e', // 军蓝
    soldier_weapons: SOLDIER_WEAPONS.BAF,
    rosters: [
      {
        key: 'baf-mechanized',
        name: '机械化编制',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#3a5f9e'),
        description:
          '以"武士"步战车为核心的机械化编制，英军传统步兵作战风格，强调阵地攻防。',
        tactics: {
          role: '阵地攻防 / 火力压制',
          strengths: ['载具与步兵结合紧密', '防御作战能力强'],
          weaknesses: ['机动性一般', '反载具手段有限'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'FV510 Warrior', type: '步兵战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/uk_fv510.png', initial_delay: 480, note: '30mm机炮' },
          { name: 'FV107 Scimitar', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 900, icon_url: '/squad-assets/vehicles/uk_fv107.png', initial_delay: 120 },
          { name: 'HMT Jackal', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: 'MAN HX60 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
          { name: 'MAN HX60 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'NLAW', secondary: 'L131A1', gear: ['2x 破片手雷', '烟雾弹', '绷带x2'], special: '一次性反坦克导弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'L7A2 GPMG', secondary: 'L131A1', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'L129A1', secondary: 'L131A1', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '榴弹兵', type: '火力支援', limit: 1, primary: 'L85A2 + L123A2', secondary: 'L131A1', gear: ['2x 破片手雷', '烟雾弹'], special: '40mm高爆榴弹x6' },
        ],
      },
      {
        key: 'baf-motorized',
        name: '摩托化编制',
        type: '摩托化',
        type_key: 'motorized',
        type_icon: NATO_ICON('motorized', '#3a5f9e'),
        description:
          '以 Jackal 巡逻车与 HMT 车族为核心的快速机动编制，擅长侦察与快速反应作战。',
        tactics: {
          role: '快速侦察 / 机动巡逻',
          strengths: ['机动性好', '适合沙漠与山地'],
          weaknesses: ['装甲防护弱', '攻坚能力有限'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'HMT Jackal', type: '侦察车', category: 'light_attack', count: 3, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: 'FV107 Scimitar', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 900, icon_url: '/squad-assets/vehicles/uk_fv107.png', initial_delay: 120 },
          { name: 'MAN HX60 运输卡车', type: '运输卡车', category: 'logistics', count: 5, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
          { name: 'MAN HX60 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'NLAW', secondary: 'L131A1', gear: ['2x 破片手雷', '烟雾弹'], special: '一次性反坦克导弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'L7A2 GPMG', secondary: 'L131A1', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'L129A1', secondary: 'L131A1', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
      {
        key: 'baf-light',
        name: '轻步兵编制',
        type: '轻步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#3a5f9e'),
        description:
          '英军精锐轻步兵营，山地与丛林作战经验丰富，以徒步机动和精准射击见长。',
        tactics: {
          role: '山地作战 / 防御据守',
          strengths: ['单兵素质高', '隐蔽机动强', '票数风险低'],
          weaknesses: ['无重装备', '缺乏反载具手段'],
        },
        commander_abilities: ['无人机侦察'],
        vehicles: [
          { name: 'HMT Jackal', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: 'MAN HX60 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
          { name: 'MAN HX60 补给卡车', type: '补给卡车', category: 'logistics', count: 1, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'NLAW', secondary: 'L131A1', gear: ['2x 破片手雷', '烟雾弹'], special: '一次性反坦克导弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'L7A2 GPMG', secondary: 'L131A1', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 2, primary: 'L129A1', secondary: 'L131A1', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '工兵', type: '工程', limit: 2, primary: 'L85A2', secondary: 'L131A1', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'baf-armored',
        name: '装甲旅编制',
        type: '装甲',
        type_key: 'armored',
        type_icon: NATO_ICON('armored', '#3a5f9e'),
        description:
          '英军主战坦克部队，"挑战者2"坦克拥有顶级防护，擅长装甲对决与阵地突破。',
        tactics: {
          role: '装甲对决 / 阵地突破',
          strengths: ['坦克防护顶级', '火炮精度高'],
          weaknesses: ['机动性偏弱', '损失惩罚极高'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'CR2 Challenger 2', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/uk_challenger2.png', initial_delay: 900, note: '120mm线膛炮，复合装甲' },
          { name: 'FV510 Warrior', type: '步兵战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/uk_fv510.png', initial_delay: 480 },
          { name: 'FV107 Scimitar', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 900, icon_url: '/squad-assets/vehicles/uk_fv107.png', initial_delay: 120 },
          { name: 'MAN HX60 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
          { name: 'MAN HX60 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'NLAW', secondary: 'L131A1', gear: ['2x 破片手雷', '烟雾弹'], special: '一次性反坦克导弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'L7A2 GPMG', secondary: 'L131A1', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'L85A2', secondary: 'L131A1', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
    ],
  },
  {
    code: 'CAF',
    name: '加军',
    flag_url: '/squad-assets/flags/caf.png',
    theme: '#b03a2e', // 枫叶红
    soldier_weapons: SOLDIER_WEAPONS.CAF,
    rosters: [
      {
        key: 'caf-mechanized',
        name: '机械化编制',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#b03a2e'),
        description:
          '加拿大皇家军团机械化编制，装备LAV-6系列轮式战车，兼顾机动与火力。',
        tactics: {
          role: '机动突击 / 维和行动',
          strengths: ['轮式载具公路机动性好', '多功能作战能力强'],
          weaknesses: ['越野机动受限', '重装甲缺失'],
        },
        commander_abilities: [
        'A-10"疣猪"空中打击力量',
        '155 毫米火炮压制弹幕射击',
        '155 毫米火炮徐进弹幕射击',
        'MQ-9 无人侦察机',
],
        vehicles: [
          { name: 'MSVS 运兵卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 6, respawn_time: 360, icon_url: '/squad-assets/vehicles/caf_msvs.png', initial_delay: 0 },
          { name: 'MSVS 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/caf_msvs.png', initial_delay: 0 },
          { name: 'TAPV 装甲巡逻车', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/caf_tapv.png', initial_delay: 0 },
          { name: 'LAV 6 步兵战车', type: '轮式步战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/caf_lav6.png', initial_delay: 300, note: '25mm机炮' },
          { name: '豹2A6M CAN 主战坦克', type: '主战坦克', category: 'tank', count: 1, tickets: 15, respawn_time: 1200, initial_delay: 0 },
          { name: 'CH-146 运输直升机', type: '运输直升机', category: 'helicopter', count: 2, tickets: 5, respawn_time: 900, initial_delay: 360, note: '主力投送平台' },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'Carl Gustaf M4', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'C6 GPMG', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'C14 Timberwolf', secondary: 'Browning HP', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
      {
        key: 'caf-motorized',
        name: '摩托化编制',
        type: '摩托化',
        type_key: 'motorized',
        type_icon: NATO_ICON('motorized', '#b03a2e'),
        description:
          '以轻型轮式载具为主的快速部署编制，强调快速反应与远征作战。',
        tactics: {
          role: '快速反应 / 远征部署',
          strengths: ['部署速度快', '载具成本低'],
          weaknesses: ['装甲防护弱', '持续作战能力一般'],
        },
        commander_abilities: [
        'A-10"疣猪"空中打击力量',
        '155 毫米火炮压制弹幕射击',
        '155 毫米火炮徐进弹幕射击',
        'MQ-9 无人侦察机',
],
        vehicles: [
          { name: 'MSVS 运兵卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 6, respawn_time: 360, icon_url: '/squad-assets/vehicles/caf_msvs.png', initial_delay: 0 },
          { name: 'MSVS 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/caf_msvs.png', initial_delay: 0 },
          { name: 'LUVW 运输车', type: '运输卡车', category: 'logistics', count: 1, tickets: 0, initial_delay: 0 },
          { name: 'LUVW（C6 机枪）', type: '装甲巡逻车', category: 'light_attack', count: 1, tickets: 0, initial_delay: 0 },
          { name: 'TAPV 装甲巡逻车', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/caf_tapv.png', initial_delay: 0 },
          { name: '郊狼侦察车', type: '装甲巡逻车', category: 'light_attack', count: 3, tickets: 10, initial_delay: 0 },
          { name: '豹2A6M CAN 主战坦克', type: '主战坦克', category: 'tank', count: 1, tickets: 15, respawn_time: 1200, initial_delay: 0 },
          { name: 'CH-146 运输直升机', type: '运输直升机', category: 'helicopter', count: 2, tickets: 5, respawn_time: 600, initial_delay: 360, note: '主力投送平台' },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'Carl Gustaf M4', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'C6 GPMG', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
        ],
      },
      {
        key: 'caf-light',
        name: '轻步兵编制',
        type: '轻步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#b03a2e'),
        description:
          '加拿大轻步兵营，擅长极寒与森林地形作战，徒步机动为主，隐蔽性强。',
        tactics: {
          role: '森林战 / 极寒作战',
          strengths: ['地形适应性强', '隐蔽性好'],
          weaknesses: ['无装甲支援', '机动速度慢'],
        },
        commander_abilities: ['无人机侦察'],
        vehicles: [
          { name: 'MSVS 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/caf_msvs.png', initial_delay: 0 },
          { name: 'MSVS 补给卡车', type: '补给卡车', category: 'logistics', count: 1, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/caf_msvs.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'Carl Gustaf M4', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'C6 GPMG', secondary: 'Browning HP', gear: ['2x 破片手雷'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 2, primary: 'C14 Timberwolf', secondary: 'Browning HP', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
    ],
  },
  {
    code: 'PLA',
    name: '解放军陆军',
    flag_url: '/squad-assets/flags/pla.png',
    theme: '#e8b923', // 陆军黄
    soldier_weapons: SOLDIER_WEAPONS.PLA,
    rosters: [
      {
        key: 'pla-motorized',
        name: '摩托化编制',
        type: '摩托化',
        type_key: 'motorized',
        type_icon: NATO_ICON('motorized', '#e8b923'),
        description:
          '轮式快速反应编制，依托公路网快速机动，遂行边境防卫与快速支援任务。',
        tactics: {
          role: '快速反应 / 边境防卫',
          strengths: ['机动迅速', '载具成本低', '部署灵活'],
          weaknesses: ['装甲薄弱', '攻坚能力有限'],
        },
        commander_abilities: [
        '152mm 压制型重炮火力支援',
        '152mm 徐进式重炮火力支援',
        'JH-7A 火箭空袭',
        'CH-4A 无人侦察机',
],
        vehicles: [
          { name: 'CTM131 运输型（QJZ89）', type: '运输卡车', category: 'logistics', count: 5, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CTM131 补给型', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'ZSL92A 装甲运输车（QLZ89）', type: '装甲运兵车', category: 'apc', count: 1, tickets: 0, initial_delay: 0 },
          { name: 'ZSL92A 装甲运输车（QLZ87）', type: '装甲运兵车', category: 'apc', count: 1, tickets: 5, initial_delay: 0 },
          { name: 'ZSL92 装甲运输车', type: '装甲运兵车', category: 'apc', count: 1, tickets: 10, initial_delay: 0 },
          { name: 'ZBL08 步兵战车', type: '轮式步战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_zbl08.png', initial_delay: 480, note: '30mm机炮' },
          { name: 'ZTZ99A 主战坦克', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/pla_ztz99a.png', initial_delay: 900, note: '125mm滑膛炮' },
          { name: 'Z-8G 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 0, respawn_time: 600, initial_delay: 0 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'PF-98 120mm火箭筒', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'QJY-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'QBU-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
      {
        key: 'pla-armored',
        name: '装甲旅编制',
        type: '装甲',
        type_key: 'armored',
        type_icon: NATO_ICON('armored', '#e8b923'),
        description:
          '以主战坦克为核心的重型装甲编制，拥有全编制最强的正面火力和装甲防护，是突破防线的主力。',
        tactics: {
          role: '装甲突破 / 反装甲',
          strengths: ['火力与防护顶级', '心理威慑力强'],
          weaknesses: ['载具昂贵，损失惩罚极高', '步兵伴随不足', '机动受限'],
        },
        commander_abilities: [
        '152mm 压制型重炮火力支援',
        '152mm 徐进式重炮火力支援',
        'JH-7A 火箭空袭',
        'CH-4A 无人侦察机',
],
        vehicles: [
          { name: 'CTM131 运输型（QJZ89）', type: '运输卡车', category: 'logistics', count: 5, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CTM131 补给型', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'ZSD89 装甲运输车（QJZ89）', type: '装甲运兵车', category: 'apc', count: 1, tickets: 0, initial_delay: 0 },
          { name: 'ZSD89 装甲运输车（QLZ87）', type: '装甲运兵车', category: 'apc', count: 1, tickets: 0, initial_delay: 0 },
          { name: 'ZSD89II 装甲运输车', type: '装甲运兵车', category: 'apc', count: 1, tickets: 10, initial_delay: 0 },
          { name: 'ZTZ99A 主战坦克', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_ztz99a.png', initial_delay: 900, note: '125mm滑膛炮' },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'PF-98 120mm火箭筒', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'QJY-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'QBZ-95-1', secondary: 'QSZ-92', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'pla-light',
        name: '轻步兵编制',
        type: '轻步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#e8b923'),
        description:
          '山地轻型合成部队，以猛士车族为机动平台，适合高原与山地快速部署。',
        tactics: {
          role: '高原山地作战 / 快速部署',
          strengths: ['山地机动性好', '票数风险低'],
          weaknesses: ['缺乏重火力', '防护薄弱'],
        },
        commander_abilities: [
        '152mm 压制型重炮火力支援',
        '152mm 徐进式重炮火力支援',
        'JH-7A 火箭空袭',
        'CH-4A 无人侦察机',
],
        vehicles: [
          { name: 'CTM131 运输型（QJY88）', type: '运输卡车', category: 'logistics', count: 5, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CTM131 补给型', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: '"山猫"全地形车（运输型）', type: '运输卡车', category: 'logistics', count: 1, tickets: 0, respawn_time: 360, initial_delay: 0 },
          { name: '"山猫"全地形车（补给型）', type: '补给卡车', category: 'logistics', count: 1, tickets: 0, initial_delay: 0 },
          { name: '"山猫"全地形车（运输型 QJZ89）', type: '运输卡车', category: 'logistics', count: 2, tickets: 5, initial_delay: 0 },
          { name: '"山猫"全地形车（运输型 QLZ87）', type: '运输卡车', category: 'logistics', count: 1, tickets: 0, initial_delay: 0 },
          { name: 'CSK131（QJZ89）', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'CSK131（QLZ87）', type: '侦察车', category: 'light_attack', count: 3, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'CSK131（HJ8）', type: '侦察车', category: 'light_attack', count: 3, tickets: 10, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'ZTZ99A 主战坦克', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/pla_ztz99a.png', initial_delay: 900, note: '125mm滑膛炮' },
          { name: 'Z-8G 运输直升机', type: '运输直升机', category: 'helicopter', count: 5, tickets: 0, initial_delay: 0 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'PF-98 120mm火箭筒', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'QJY-88', secondary: 'QSZ-92', gear: ['2x 破片手雷'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 2, primary: 'QBU-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '工兵', type: '工程', limit: 2, primary: 'QBZ-95-1', secondary: 'QSZ-92', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'pla-airassault',
        name: '空降编制',
        type: '空降',
        type_key: 'airassault',
        type_icon: NATO_ICON('airassault', '#e8b923'),
        description:
          '以直-8、直-9 直升机为主的空中突击编制，可快速投送兵力夺占关键地域。',
        tactics: {
          role: '空中突击 / 机降夺点',
          strengths: ['投送速度快', '出其不意'],
          weaknesses: ['直升机损失风险高', '重装备携带有限'],
        },
        commander_abilities: [
        '152mm 压制型重炮火力支援',
        '152mm 徐进式重炮火力支援',
        'JH-7A 火箭空袭',
        'CH-4A 无人侦察机',
],
        vehicles: [
          { name: 'CTM131 运输型（QJZ89）', type: '运输卡车', category: 'logistics', count: 5, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CTM131 补给型', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CSK131（QJY88）', type: '侦察车', category: 'light_attack', count: 3, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: '"山猫"全地形车（运输型 QJZ89）', type: '运输卡车', category: 'logistics', count: 1, tickets: 0, initial_delay: 0 },
          { name: '"山猫"全地形车（运输型 QLZ87）', type: '运输卡车', category: 'logistics', count: 1, tickets: 0, initial_delay: 0 },
          { name: 'CSK131（QJZ89）', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'CSK131（QJC88 RWS）', type: '侦察车', category: 'light_attack', count: 2, tickets: 10, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'CSK131（HJ8）', type: '侦察车', category: 'light_attack', count: 2, tickets: 10, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'ZTZ99A 主战坦克', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 1800, icon_url: '/squad-assets/vehicles/pla_ztz99a.png', initial_delay: 900, note: '125mm滑膛炮' },
          { name: 'Z-8G 运输直升机', type: '运输直升机', category: 'helicopter', count: 5, tickets: 0, initial_delay: 0 },
          { name: 'Z-9A 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 0, initial_delay: 0 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'PF-98 120mm火箭筒', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'QJY-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'QBU-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
    
      {
        key: 'pla-combined',
        name: '第118合成旅',
        type: '合成',
        type_key: 'combined',
        type_icon: NATO_ICON('combined', '#e8b923'),
        description: '多兵种合成编制，坦克、步战车与直升机齐备，攻防兼备，可应对各类战场态势。',
        tactics: {
          role: '全频谱作战 / 战略预备队',
          strengths: ['兵种齐全', '战场适应性强', '独立作战能力高'],
          weaknesses: ['编制复杂度高', '后勤压力大', '整体损失惩罚高'],
        },
        commander_abilities: ['152mm 压制型重炮火力支援', '152mm 徐进式重炮火力支援', 'JH-7A 火箭空袭', 'CH-4A 无人侦察机'],
        vehicles: [
          { name: 'CTM131 运输型（QJZ89）', type: '运输卡车', category: 'logistics', count: 5, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CTM131 补给型', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CSK131（QJZ89）', type: '侦察车', category: 'light_attack', count: 3, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'CSK131（QLZ87）', type: '侦察车', category: 'light_attack', count: 3, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'ZSL92A 装甲运输车（QLZ89）', type: '装甲运兵车', category: 'apc', count: 1, tickets: 0, initial_delay: 0 },
          { name: 'ZBL08 步兵战车', type: '轮式步战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_zbl08.png', initial_delay: 480, note: '30mm机炮' },
          { name: 'ZBD04A 步兵战车', type: '步兵战车', category: 'ifv', count: 1, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_zbd04a.png', initial_delay: 480 },
          { name: 'ZTZ99A 主战坦克', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 900, icon_url: '/squad-assets/vehicles/pla_ztz99a.png', initial_delay: 900, note: '125mm滑膛炮' },
          { name: 'Z-9A 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 0, respawn_time: 360, initial_delay: 0 },
        ],
        specialist_kits: [{"name": "重筒", "type": "反载具", "limit": 1, "primary": "PF-98 120mm火箭筒", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "烟雾弹"], "special": "测距仪"}, {"name": "通用机枪", "type": "火力支援", "limit": 2, "primary": "QJY-88", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "烟雾弹"], "special": "两脚架"}, {"name": "特射", "type": "侦察", "limit": 1, "primary": "QBU-88", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "测距仪"], "special": "可变倍率瞄准镜"}],
      },

      {
        key: 'pla-support',
        name: '第80支援旅',
        type: '支援',
        type_key: 'support',
        type_icon: NATO_ICON('support', '#e8b923'),
        description: '- 每个 FOB 可获得 1 个额外的反坦克导弹阵地',
        tactics: {
          role: '后勤支援 / 区域控制',
          strengths: ['补给与维修能力强', '持续作战时间长'],
          weaknesses: ['正面火力不足', '装甲防护有限'],
        },
        commander_abilities: ['152mm 压制型重炮火力支援', '152mm 徐进式重炮火力支援', 'JH-7A 火箭空袭', 'CH-4A 无人侦察机'],
        vehicles: [
          { name: 'CTM131 运输型（QJZ89）', type: '运输卡车', category: 'logistics', count: 5, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CTM131 补给型', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: '"山猫"全地形车（运输型）', type: '运输卡车', category: 'logistics', count: 1, tickets: 0, initial_delay: 0 },
          { name: '"山猫"全地形车（补给型）', type: '补给卡车', category: 'logistics', count: 1, tickets: 0, initial_delay: 0 },
          { name: 'CSK131（QJY88）', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'CSK131（QJZ89）', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'ZSL10 装甲运输车（QJZ89）', type: '轮式步战车', category: 'ifv', count: 2, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_zsl10.png', initial_delay: 300 },
          { name: 'ZBL08 步兵战车', type: '轮式步战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_zbl08.png', initial_delay: 480, note: '30mm机炮' },
          { name: 'Z-8G 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 0, respawn_time: 600, initial_delay: 0 },
        ],
        specialist_kits: [{"name": "重筒", "type": "反载具", "limit": 1, "primary": "PF-98 120mm火箭筒", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "烟雾弹"], "special": "测距仪"}, {"name": "通用机枪", "type": "火力支援", "limit": 2, "primary": "QJY-88", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "烟雾弹"], "special": "两脚架"}, {"name": "特射", "type": "侦察", "limit": 1, "primary": "QBU-88", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "测距仪"], "special": "可变倍率瞄准镜"}],
      },
],
  },
  {
    code: 'PLAAGF',
    name: '解放军两栖部队',
    flag_url: FLAGS.PLAAGF,
    theme: '#1e4f9e', // 两栖蓝
    soldier_weapons: SOLDIER_WEAPONS.PLAAGF,
    rosters: [
      {
        key: 'plaagf-mechanized',
        name: '机械化编制',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#1e4f9e'),
        description:
          '以 ZBD-05 两栖步战车为核心的机械化编制，具备抢滩登陆与内河水网突击能力。',
        tactics: {
          role: '两栖突击 / 抢滩登陆',
          strengths: ['两栖突击能力强', '载具火力均衡'],
          weaknesses: ['登陆作战损失风险高', '依赖水上投送'],
        },
        commander_abilities: [
        '152mm 压制型重炮火力支援',
        '152mm 徐进式重炮火力支援',
        'JH-7A 火箭空袭',
        'CH-4A 无人侦察机',
],
        vehicles: [
          { name: 'CTM131 运输型（QJZ89）', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'ZSD05 补给型', type: '两栖装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, initial_delay: 240 },
          { name: 'ZSD05 两栖装甲输送车', type: '两栖装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, initial_delay: 240 },
          { name: 'ZSD89 装甲运输车（QLZ87）', type: '装甲运兵车', category: 'apc', count: 1, tickets: 5, initial_delay: 0 },
          { name: 'ZSD89II 装甲运输车', type: '装甲运兵车', category: 'apc', count: 1, tickets: 10, initial_delay: 0 },
          { name: 'ZBD05 两栖步战车', type: '两栖步战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, initial_delay: 480, note: '30mm炮，水上航速30km/h' },
          { name: 'ZLT05 两栖突击炮', type: '两栖突击炮', category: 'ifv', count: 1, tickets: 10, initial_delay: 0 },
          { name: 'ZTZ99A 主战坦克', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/pla_ztz99a.png', initial_delay: 900 },
          { name: 'Z-8G 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 0, respawn_time: 900, initial_delay: 0 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'PF-98 120mm火箭筒', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'QJY-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'QBU-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
      {
        key: 'plaagf-armored',
        name: '装甲旅编制',
        type: '装甲',
        type_key: 'armored',
        type_icon: NATO_ICON('armored', '#1e4f9e'),
        description:
          '两栖部队重装突击力量，ZTZ-99A 坦克与两栖战车协同，登陆场上的钢铁拳头。',
        tactics: {
          role: '登陆突破 / 装甲反冲击',
          strengths: ['坦克火力防护强', '两栖机动'],
          weaknesses: ['载具昂贵', '损失惩罚高'],
        },
        commander_abilities: [
        '152mm 压制型重炮火力支援',
        '152mm 徐进式重炮火力支援',
        'JH-7A 火箭空袭',
        'CH-4A 无人侦察机',
],
        vehicles: [
          { name: 'CTM131 运输型（QJZ89）', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'ZSD05 补给型', type: '两栖装甲运兵车', category: 'apc', count: 5, tickets: 5, respawn_time: 600, initial_delay: 240 },
          { name: 'ZSD05 两栖装甲输送车', type: '两栖装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, initial_delay: 240 },
          { name: 'ZSD89 装甲运输车（QLZ87）', type: '装甲运兵车', category: 'apc', count: 1, tickets: 5, initial_delay: 0 },
          { name: 'ZLT05 两栖突击炮', type: '两栖突击炮', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, initial_delay: 0 },
          { name: 'ZTZ99A 主战坦克', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/pla_ztz99a.png', initial_delay: 900 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'PF-98 120mm火箭筒', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'QJY-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'QBZ-95-1', secondary: 'QSZ-92', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'plaagf-light',
        name: '轻步兵编制',
        type: '轻步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#1e4f9e'),
        description:
          '两栖部队轻步兵，擅长岛屿与沿海复杂地形作战，徒步机动为主。',
        tactics: {
          role: '岛屿作战 / 渗透侦察',
          strengths: ['地形适应性强', '票数风险低'],
          weaknesses: ['缺乏重装备', '机动依赖步行'],
        },
        commander_abilities: ['无人机侦察'],
        vehicles: [
          { name: '猛士 CSK-131', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: '陕汽 CTM-131 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'PF-98 120mm火箭筒', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'QJY-88', secondary: 'QSZ-92', gear: ['2x 破片手雷'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 2, primary: 'QBU-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
    
      {
        key: 'plaagf-combined',
        name: '第十四两栖合成旅',
        type: '合成',
        type_key: 'combined',
        type_icon: NATO_ICON('combined', '#1e4f9e'),
        description: '多兵种合成编制，坦克、步战车与直升机齐备，攻防兼备，可应对各类战场态势。',
        tactics: {
          role: '全频谱作战 / 战略预备队',
          strengths: ['兵种齐全', '战场适应性强', '独立作战能力高'],
          weaknesses: ['编制复杂度高', '后勤压力大', '整体损失惩罚高'],
        },
        commander_abilities: ['152mm 压制型重炮火力支援', '152mm 徐进式重炮火力支援', 'JH-7A 火箭空袭', 'CH-4A 无人侦察机'],
        vehicles: [
          { name: 'CTM131 运输型（QJZ89）', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CTM131 补给型', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'ZSD05 补给型', type: '两栖装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, initial_delay: 240 },
          { name: 'ZSD05 两栖装甲输送车', type: '两栖装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, initial_delay: 240 },
          { name: 'ZSD89 装甲运输车（QJZ89）', type: '装甲运兵车', category: 'apc', count: 1, tickets: 0, initial_delay: 0 },
          { name: 'ZBD05 两栖步战车', type: '两栖步战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 600, initial_delay: 480, note: '30mm炮，水上航速30km/h' },
          { name: 'ZLT05 两栖突击炮', type: '两栖突击炮', category: 'ifv', count: 1, tickets: 10, initial_delay: 0 },
          { name: 'ZTZ99A 主战坦克', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 900, icon_url: '/squad-assets/vehicles/pla_ztz99a.png', initial_delay: 900 },
          { name: 'Z-8G 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 0, respawn_time: 360, initial_delay: 0 },
        ],
        specialist_kits: [{"name": "重筒", "type": "反载具", "limit": 2, "primary": "PF-98 120mm火箭筒", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "烟雾弹"], "special": "测距仪"}, {"name": "通用机枪", "type": "火力支援", "limit": 2, "primary": "QJY-88", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "烟雾弹"], "special": "两脚架"}, {"name": "特射", "type": "侦察", "limit": 1, "primary": "QBU-88", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "测距仪"], "special": "可变倍率瞄准镜"}],
      },
],
  },
  {
    code: 'PLANMC',
    name: '解放军海军陆战队',
    flag_url: FLAGS.PLANMC,
    theme: '#2f6b9e', // 海军蓝
    soldier_weapons: SOLDIER_WEAPONS.PLANMC,
    rosters: [
      {
        key: 'planmc-mechanized',
        name: '机械化编制',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#2f6b9e'),
        description:
          '海军陆战队主力机械化编制，ZBL-08 轮式步战车与 ZBD-05 两栖战车混编，抢滩与陆地突击兼顾。',
        tactics: {
          role: '两栖突击 / 陆地攻坚',
          strengths: ['两栖与陆战兼备', '载具体系完整'],
          weaknesses: ['编制造价高', '损失惩罚大'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察', 'JH-7A近距支援'],
        vehicles: [
          { name: 'ZBL-08', type: '轮式步战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_zbl08.png', initial_delay: 480, note: '30mm机炮' },
          { name: 'ZBD-05', type: '两栖步战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, initial_delay: 480 },
          { name: 'ZSL-10', type: '轮式装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_zsl10.png', initial_delay: 300 },
          { name: '猛士 CSK-131', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: '陕汽 CTM-131 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'PF-98 120mm火箭筒', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'QJY-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'QBU-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '工兵', type: '工程', limit: 2, primary: 'QBZ-95-1', secondary: 'QSZ-92', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'planmc-motorized',
        name: '摩托化编制',
        type: '摩托化',
        type_key: 'motorized',
        type_icon: NATO_ICON('motorized', '#2f6b9e'),
        description:
          '以轮式载具为主的快速反应编制，依托公路网快速部署，适合登陆后的纵深推进。',
        tactics: {
          role: '快速推进 / 纵深穿插',
          strengths: ['公路机动快', '部署灵活'],
          weaknesses: ['装甲防护一般', '攻坚能力有限'],
        },
        commander_abilities: [
        '152mm 压制型重炮火力支援',
        '152mm 徐进式重炮火力支援',
        'JH-7A 火箭空袭',
        'CH-4A 无人侦察机',
],
        vehicles: [
          { name: 'CTM131（QJZ89）', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CTM131 补给型', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'ZSL10 轮式运兵车', type: '轮式装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_zsl10.png', initial_delay: 300 },
          { name: 'ZBL08 步兵战车', type: '轮式步战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_zbl08.png', initial_delay: 480, note: '30mm机炮' },
          { name: 'ZLT05 两栖突击炮', type: '两栖突击炮', category: 'ifv', count: 2, tickets: 10, respawn_time: 900, initial_delay: 0 },
          { name: 'Z-8J 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 0, respawn_time: 600, initial_delay: 0 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'PF-98 120mm火箭筒', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'QJY-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'QBU-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
      {
        key: 'planmc-armored',
        name: '装甲旅编制',
        type: '装甲',
        type_key: 'armored',
        type_icon: NATO_ICON('armored', '#2f6b9e'),
        description:
          '陆战队重装甲突击力量，ZTZ-99A 主战坦克与 ZTD-05 突击炮协同，登陆场的装甲矛头。',
        tactics: {
          role: '装甲突破 / 反装甲',
          strengths: ['坦克火力防护强', '突击力强'],
          weaknesses: ['载具昂贵', '损失惩罚极高'],
        },
        commander_abilities: [
        '152mm 压制型重炮火力支援',
        '152mm 徐进式重炮火力支援',
        'JH-7A 火箭空袭',
        'CH-4A 无人侦察机',
],
        vehicles: [
          { name: 'ZSD05 两栖装甲输送车', type: '两栖装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 360, initial_delay: 240 },
          { name: 'ZSD05 补给型', type: '两栖装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, initial_delay: 240 },
          { name: 'ZBD05 两栖步战车', type: '两栖步战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, initial_delay: 480 },
          { name: 'CSK131（HJ8）', type: '侦察车', category: 'light_attack', count: 1, tickets: 10, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'ZLT05 两栖突击炮', type: '两栖突击炮', category: 'ifv', count: 4, tickets: 10, respawn_time: 600, initial_delay: 0 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'PF-98 120mm火箭筒', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'QJY-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'QBZ-95-1', secondary: 'QSZ-92', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'planmc-airassault',
        name: '空降编制',
        type: '空降',
        type_key: 'airassault',
        type_icon: NATO_ICON('airassault', '#2f6b9e'),
        description:
          '陆战队空中突击编制，直-8J 直升机投送步兵，抢占登陆场纵深要点。',
        tactics: {
          role: '空中突击 / 纵深夺点',
          strengths: ['投送迅速', '出其不意'],
          weaknesses: ['直升机风险高', '重装备有限'],
        },
        commander_abilities: [
        '152mm 压制型重炮火力支援',
        '152mm 徐进式重炮火力支援',
        'JH-7A 火箭空袭',
        'CH-4A 无人侦察机',
],
        vehicles: [
          { name: 'CTM131（QJZ89）', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CTM131 补给型', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CSK131（QJY88）', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'CSK131（QJZ89）', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'CSK131（QJC88 RWS）', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'CSK131（HJ8）', type: '侦察车', category: 'light_attack', count: 1, tickets: 10, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'ZLT05 两栖突击炮', type: '两栖突击炮', category: 'ifv', count: 2, tickets: 10, respawn_time: 1200, initial_delay: 0 },
          { name: 'Z-8J 运输直升机', type: '运输直升机', category: 'helicopter', count: 5, tickets: 0, initial_delay: 0 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'PF-98 120mm火箭筒', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'QJY-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'QBU-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
    
      {
        key: 'planmc-combined',
        name: '中国人民解放军合成第5旅',
        type: '合成',
        type_key: 'combined',
        type_icon: NATO_ICON('combined', '#2f6b9e'),
        description: '多兵种合成编制，坦克、步战车与直升机齐备，攻防兼备，可应对各类战场态势。',
        tactics: {
          role: '全频谱作战 / 战略预备队',
          strengths: ['兵种齐全', '战场适应性强', '独立作战能力高'],
          weaknesses: ['编制复杂度高', '后勤压力大', '整体损失惩罚高'],
        },
        commander_abilities: ['152mm 压制型重炮火力支援', '152mm 徐进式重炮火力支援', 'JH-7A 火箭空袭', 'CH-4A 无人侦察机'],
        vehicles: [
          { name: 'CTM131（QJZ89）', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CTM131 补给型', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'ZSD05 补给型', type: '两栖装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, initial_delay: 240 },
          { name: 'ZSD05 两栖装甲输送车', type: '两栖装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, initial_delay: 240 },
          { name: 'ZBD05 两栖步战车', type: '两栖步战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, initial_delay: 480 },
          { name: 'ZLT05 两栖突击炮', type: '两栖突击炮', category: 'ifv', count: 3, tickets: 10, initial_delay: 0 },
          { name: 'Z-8J 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 0, respawn_time: 360, initial_delay: 0 },
        ],
        specialist_kits: [{"name": "重筒", "type": "反载具", "limit": 2, "primary": "PF-98 120mm火箭筒", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "烟雾弹"], "special": "测距仪"}, {"name": "通用机枪", "type": "火力支援", "limit": 2, "primary": "QJY-88", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "烟雾弹"], "special": "两脚架"}, {"name": "特射", "type": "侦察", "limit": 1, "primary": "QBU-88", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "测距仪"], "special": "可变倍率瞄准镜"}, {"name": "工兵", "type": "工程", "limit": 2, "primary": "QBZ-95-1", "secondary": "QSZ-92", "gear": ["破片手雷", "修理工具"], "special": "C4炸药"}],
      },

      {
        key: 'planmc-light_infantry',
        name: '第四海军陆战队特种作战营',
        type: '轻步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#2f6b9e'),
        description: '- 反坦克导弹阵地可用',
        tactics: {
          role: '渗透 / 侦察 / 防御',
          strengths: ['票数消耗低', '隐蔽性强', '适合城区与丛林作战'],
          weaknesses: ['无装甲支援', '反载具能力有限'],
        },
        commander_abilities: ['152mm 压制型重炮火力支援', '152mm 徐进式重炮火力支援', 'JH-7A 火箭空袭', 'CH-4A 无人侦察机'],
        vehicles: [
          { name: 'CTM131（QJZ89）', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CTM131 补给型', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CSK131（QJY88）', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'CSK131（QJZ89）', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'CSK131（QJC88 RWS）', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'CSK131（HJ8）', type: '侦察车', category: 'light_attack', count: 1, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: 'ZLT05 两栖突击炮', type: '两栖突击炮', category: 'ifv', count: 2, tickets: 10, respawn_time: 1200, initial_delay: 0 },
          { name: 'Z-8J 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 0, respawn_time: 360, initial_delay: 0 },
        ],
        specialist_kits: [{"name": "重筒", "type": "反载具", "limit": 2, "primary": "PF-98 120mm火箭筒", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "烟雾弹"], "special": "测距仪"}, {"name": "通用机枪", "type": "火力支援", "limit": 2, "primary": "QJY-88", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "烟雾弹"], "special": "两脚架"}, {"name": "特射", "type": "侦察", "limit": 1, "primary": "QBU-88", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "测距仪"], "special": "可变倍率瞄准镜"}, {"name": "工兵", "type": "工程", "limit": 2, "primary": "QBZ-95-1", "secondary": "QSZ-92", "gear": ["破片手雷", "修理工具"], "special": "C4炸药"}],
      },

      {
        key: 'planmc-support',
        name: '第17海军陆战队支援营',
        type: '支援',
        type_key: 'support',
        type_icon: NATO_ICON('support', '#2f6b9e'),
        description: '- 每个 FOB 可获得 1 个额外的反坦克导弹阵地',
        tactics: {
          role: '后勤支援 / 区域控制',
          strengths: ['补给与维修能力强', '持续作战时间长'],
          weaknesses: ['正面火力不足', '装甲防护有限'],
        },
        commander_abilities: ['152mm 压制型重炮火力支援', '152mm 徐进式重炮火力支援', 'JH-7A 火箭空袭', 'CH-4A 无人侦察机'],
        vehicles: [
          { name: 'CTM131（QJZ89）', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'CTM131 补给型', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: 'ZSD05 补给型', type: '两栖装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, initial_delay: 240 },
          { name: 'ZSD05 两栖装甲输送车', type: '两栖装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, initial_delay: 240 },
          { name: 'ZSL10 轮式运兵车', type: '轮式装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_zsl10.png', initial_delay: 300 },
          { name: 'ZBD05 两栖步战车', type: '两栖步战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, initial_delay: 480 },
          { name: 'ZLT05 两栖突击炮', type: '两栖突击炮', category: 'ifv', count: 2, tickets: 10, respawn_time: 1200, initial_delay: 0 },
          { name: 'Z-8J 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 0, respawn_time: 600, initial_delay: 0 },
        ],
        specialist_kits: [{"name": "重筒", "type": "反载具", "limit": 2, "primary": "PF-98 120mm火箭筒", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "烟雾弹"], "special": "测距仪"}, {"name": "通用机枪", "type": "火力支援", "limit": 2, "primary": "QJY-88", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "烟雾弹"], "special": "两脚架"}, {"name": "特射", "type": "侦察", "limit": 1, "primary": "QBU-88", "secondary": "QSZ-92", "gear": ["2x 破片手雷", "测距仪"], "special": "可变倍率瞄准镜"}, {"name": "工兵", "type": "工程", "limit": 2, "primary": "QBZ-95-1", "secondary": "QSZ-92", "gear": ["破片手雷", "修理工具"], "special": "C4炸药"}],
      },
],
  },
  {
    code: 'ADF',
    name: '澳军',
    flag_url: '/squad-assets/flags/adf.png',
    theme: '#2f6b4f', // 澳军绿
    soldier_weapons: SOLDIER_WEAPONS.ADF,
    rosters: [
      {
        key: 'adf-mechanized',
        name: '机械化编制',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#2f6b4f'),
        description:
          '澳军机械化部队，ASLAV 轮式战车与 M1 坦克混编，兼顾远程机动与装甲突击。',
        tactics: {
          role: '机动突击 / 装甲支援',
          strengths: ['载具性能均衡', '丛林与沙漠适应性好'],
          weaknesses: ['编制规模较小', '后勤线长'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'M1A1 Abrams', type: '主战坦克', category: 'tank', count: 1, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/usmc_m1a1.png', initial_delay: 900 },
          { name: 'ASLAV-25', type: '轮式步战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/adf_aslav.png', initial_delay: 300, note: '25mm机炮' },
          { name: 'Bushmaster PMV', type: '防雷巡逻车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 300, icon_url: '/squad-assets/vehicles/adf_bushmaster.png', initial_delay: 0 },
          { name: 'MAN HX60 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
          { name: 'MAN HX60 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
          { name: 'MRH-90', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/adf_mrh90.png', initial_delay: 360 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'Carl Gustaf M4', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹', '绷带x2'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'MAG 58', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'SR-25', secondary: 'Browning HP', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
      {
        key: 'adf-motorized',
        name: '摩托化编制',
        type: '摩托化',
        type_key: 'motorized',
        type_icon: NATO_ICON('motorized', '#2f6b4f'),
        description:
          '澳军快速机动部队，以 Bushmaster 防雷车为核心，擅长巡逻、侦察与快速反应作战。',
        tactics: {
          role: '巡逻 / 侦察 / 快速反应',
          strengths: ['防雷性能好', '公路机动快'],
          weaknesses: ['火力有限', '防护弱于步战车'],
        },
        commander_abilities: [
        'F/A-18 大黄蜂火箭空袭',
        '155 毫米火炮压制弹幕射击',
        '155 毫米火炮徐进弹幕射击',
        'MQ-9 无人侦察机',
],
        vehicles: [
          { name: 'HX60 运兵卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 6, respawn_time: 360, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
          { name: 'HX60 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
          { name: 'PMV（Mag58）', type: '防雷巡逻车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 300, icon_url: '/squad-assets/vehicles/adf_bushmaster.png', initial_delay: 0 },
          { name: 'ASLAV 装甲侦察车', type: '装甲巡逻车', category: 'light_attack', count: 3, tickets: 10, initial_delay: 0 },
          { name: 'M1A1 主战坦克', type: '主战坦克', category: 'tank', count: 1, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/usmc_m1a1.png', initial_delay: 900 },
          { name: 'MRH-90 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 900, icon_url: '/squad-assets/vehicles/adf_mrh90.png', initial_delay: 360 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'Carl Gustaf M4', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'MAG 58', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
        ],
      },
      {
        key: 'adf-light',
        name: '轻步兵编制',
        type: '轻步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#2f6b4f'),
        description:
          '澳军传统轻步兵营，丛林作战经验丰富，徒步机动，适合复杂地形渗透作战。',
        tactics: {
          role: '丛林作战 / 渗透侦察',
          strengths: ['丛林战经验丰富', '票数风险低'],
          weaknesses: ['缺乏重装备', '机动速度慢'],
        },
        commander_abilities: ['无人机侦察'],
        vehicles: [
          { name: 'Bushmaster PMV', type: '防雷巡逻车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 300, icon_url: '/squad-assets/vehicles/adf_bushmaster.png', initial_delay: 0 },
          { name: 'MAN HX60 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
          { name: 'MAN HX60 补给卡车', type: '补给卡车', category: 'logistics', count: 1, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'Carl Gustaf M4', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'MAG 58', secondary: 'Browning HP', gear: ['2x 破片手雷'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 2, primary: 'SR-25', secondary: 'Browning HP', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '工兵', type: '工程', limit: 2, primary: 'F88', secondary: 'Browning HP', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'adf-armored',
        name: '装甲旅编制',
        type: '装甲',
        type_key: 'armored',
        type_icon: NATO_ICON('armored', '#2f6b4f'),
        description:
          '澳军装甲突击力量，M1A1 坦克集群冲击，具备独立装甲突破能力。',
        tactics: {
          role: '装甲突破 / 反装甲',
          strengths: ['坦克火力防护强'],
          weaknesses: ['载具数量有限', '损失惩罚高'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'M1A1 Abrams', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/usmc_m1a1.png', initial_delay: 900 },
          { name: 'ASLAV-25', type: '轮式步战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/adf_aslav.png', initial_delay: 300 },
          { name: 'Bushmaster PMV', type: '防雷巡逻车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 300, icon_url: '/squad-assets/vehicles/adf_bushmaster.png', initial_delay: 0 },
          { name: 'MAN HX60 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'Carl Gustaf M4', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'MAG 58', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'F88', secondary: 'Browning HP', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
    ],
  },
  {
    code: 'AFU',
    name: '乌军',
    flag_url: FLAGS.AFU,
    theme: '#2b5fc4', // 乌克兰蓝
    soldier_weapons: SOLDIER_WEAPONS.AFU,
    rosters: [
      {
        key: 'afu-mechanized',
        name: '机械化编制',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#2b5fc4'),
        description:
          '乌军机械化部队，BMP 系列与 BTR-4 混编，融合苏式装备与西方改装，作战经验丰富。',
        tactics: {
          role: '阵地攻防 / 机动反击',
          strengths: ['装备血统混杂适应性强', '战法灵活'],
          weaknesses: ['后勤保障复杂', '装甲防护参差'],
        },
        commander_abilities: [
        'SU-25"格雷奇"高精度对地轰炸',
        'SU-25"白嘴鸦"直线型对地打击',
        '152mm 压制型重炮火力支援',
        '152mm 徐进式重炮火力支援',
        'TB-2 无人机侦察',
],
        vehicles: [
          { name: 'KrAZ-6322 运兵卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 360, initial_delay: 0 },
          { name: 'MTLB 运输车', type: '装甲运兵车', category: 'apc', count: 3, tickets: 5, respawn_time: 360, initial_delay: 180 },
          { name: 'BMP-2 步兵战车', type: '步兵战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/rus_bmp2.png', initial_delay: 480 },
          { name: 'BMP-1TS 步兵战车', type: '步兵战车', category: 'ifv', count: 1, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/mea_bmp1.png', initial_delay: 480 },
          { name: 'KrAZ-6322 BM-21"冰雹"', type: '火炮', category: 'artillery', count: 4, tickets: 8, respawn_time: 600, initial_delay: 0 },
          { name: 'T-64BM2 主战坦克', type: '主战坦克', category: 'tank', count: 3, tickets: 15, respawn_time: 1200, initial_delay: 900, note: '125mm滑膛炮，现代化改装' },
          { name: 'Mi-8 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 900, icon_url: '/squad-assets/vehicles/rus_mi8.png', initial_delay: 360 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'Stugna-P', secondary: 'PM', gear: ['2x 破片手雷', '烟雾弹'], special: '遥控反坦克导弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'PM', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'SVD', secondary: 'PM', gear: ['2x 破片手雷', '测距仪'], special: 'PSO-1瞄准镜' },
          { name: '榴弹兵', type: '火力支援', limit: 1, primary: 'AK-74 + GP-25', secondary: 'PM', gear: ['2x 破片手雷', '烟雾弹'], special: '40mm高爆榴弹x6' },
        ],
      },
      {
        key: 'afu-motorized',
        name: '摩托化编制',
        type: '摩托化',
        type_key: 'motorized',
        type_icon: NATO_ICON('motorized', '#2b5fc4'),
        description:
          '以轮式载具与皮卡改装的快速机动编制，擅长游击式机动与要点防御。',
        tactics: {
          role: '快速机动 / 袭扰作战',
          strengths: ['机动灵活', '改装载具多样'],
          weaknesses: ['装甲薄弱', '重火力不足'],
        },
        commander_abilities: [
        'SU-25"格雷奇"高精度对地轰炸',
        'SU-25"白嘴鸦"直线型对地打击',
        '152mm 压制型重炮火力支援',
        '152mm 徐进式重炮火力支援',
        'TB-2 无人机侦察',
],
        vehicles: [
          { name: 'KrAZ-6322 运兵卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 360, initial_delay: 0 },
          { name: 'KrAZ-6322 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, initial_delay: 0 },
          { name: 'Kozak-2M1（NSV 重机枪型）', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, initial_delay: 0, note: '12.7mm机枪' },
          { name: 'BTR-4 步兵战车', type: '轮式步战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 600, initial_delay: 300, note: '30mm机炮，乌克兰国产' },
          { name: 'KrAZ-6322 BM-21"冰雹"', type: '火炮', category: 'artillery', count: 4, tickets: 8, respawn_time: 600, initial_delay: 0 },
          { name: 'T-64BM2 主战坦克', type: '主战坦克', category: 'tank', count: 3, tickets: 15, respawn_time: 1200, initial_delay: 900, note: '125mm滑膛炮，现代化改装' },
          { name: 'Mi-8 运输直升机', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/rus_mi8.png', initial_delay: 360 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'RPG-7V2', secondary: 'PM', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'PM', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'SVD', secondary: 'PM', gear: ['2x 破片手雷', '测距仪'], special: 'PSO-1瞄准镜' },
        ],
      },
      {
        key: 'afu-armored',
        name: '装甲旅编制',
        type: '装甲',
        type_key: 'armored',
        type_icon: NATO_ICON('armored', '#2b5fc4'),
        description:
          '乌军装甲突击力量，T-64BM2 主战坦克为主力，具备独立装甲突破能力。',
        tactics: {
          role: '装甲突击 / 反冲击',
          strengths: ['坦克火力强', '改装升级后防护提升'],
          weaknesses: ['载具昂贵', '损失惩罚高'],
        },
        commander_abilities: ['122mm炮兵支援', '无人机侦察', 'TB-2无人机'],
        vehicles: [
          { name: 'T-64BM2', type: '主战坦克', category: 'tank', count: 3, tickets: 15, respawn_time: 1200, initial_delay: 900, note: '125mm滑膛炮，现代化改装' },
          { name: 'BMP-2', type: '步兵战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/rus_bmp2.png', initial_delay: 480 },
          { name: 'Kozak-2M1', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: 'KrAZ-6322 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'Stugna-P', secondary: 'PM', gear: ['2x 破片手雷', '烟雾弹'], special: '遥控反坦克导弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'PM', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'AK-74', secondary: 'PM', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'afu-light',
        name: '轻步兵编制',
        type: '轻步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#2b5fc4'),
        description:
          '乌军轻步兵编制，擅长城市战与丛林战，徒步机动为主，隐蔽性强。',
        tactics: {
          role: '城市战 / 伏击防御',
          strengths: ['城市战经验丰富', '票数风险低'],
          weaknesses: ['缺乏重装备', '机动速度慢'],
        },
        commander_abilities: ['122mm炮兵支援'],
        vehicles: [
          { name: 'Kozak-2M1', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: 'KrAZ-6322 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, initial_delay: 0 },
          { name: 'KrAZ-6322 补给卡车', type: '补给卡车', category: 'logistics', count: 1, tickets: 8, respawn_time: 180, initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'RPG-7V2', secondary: 'PM', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'PM', gear: ['2x 破片手雷'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 2, primary: 'SVD', secondary: 'PM', gear: ['2x 破片手雷', '测距仪'], special: 'PSO-1瞄准镜' },
        ],
      },
    ],
  },
  {
    code: 'TLF',
    name: '土耳其陆军',
    flag_url: FLAGS.TLF,
    theme: '#c0392b', // 土耳其红
    soldier_weapons: SOLDIER_WEAPONS.TLF,
    rosters: [
      {
        key: 'tlf-mechanized',
        name: '机械化编制',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#c0392b'),
        description:
          '土军机械化编制，PARS III 与 ACV-15 装甲车族为核心，重视遥控武器站与火力压制。',
        tactics: {
          role: '阵地攻防 / 装甲协同',
          strengths: ['遥控武器站普及', '火力压制强'],
          weaknesses: ['步兵伴随要求高', '缺乏重型装甲优势'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察', 'TB-2无人机'],
        vehicles: [
          { name: 'PARS III IFV', type: '轮式步战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 900, initial_delay: 480, note: '25mm机炮' },
          { name: 'ACV-15 IFV', type: '履带式步战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 900, initial_delay: 480 },
          { name: 'Cobra-II', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, initial_delay: 0, note: '12.7mm重机枪' },
          { name: 'BMC-185 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 6, respawn_time: 180, initial_delay: 0 },
          { name: 'BMC-185 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 6, respawn_time: 180, initial_delay: 0 },
          { name: 'UH-60', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/us_uh60.png', initial_delay: 360 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'Carl Gustaf M2', secondary: 'G17', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'MG3', secondary: 'G17', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'KNT-76', secondary: 'G17', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '榴弹兵', type: '火力支援', limit: 1, primary: 'MPT-76 + MKE MGL', secondary: 'G17', gear: ['2x 破片手雷', '烟雾弹'], special: '转轮榴弹发射器' },
        ],
      },
      {
        key: 'tlf-motorized',
        name: '摩托化编制',
        type: '摩托化',
        type_key: 'motorized',
        type_icon: NATO_ICON('motorized', '#c0392b'),
        description:
          '以 Cobra-II 与轮式装甲车为主的快速机动编制，擅长山地与城市机动作战。',
        tactics: {
          role: '快速机动 / 山地作战',
          strengths: ['机动灵活', '山地适应性强'],
          weaknesses: ['装甲薄弱', '攻坚能力有限'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'Cobra-II', type: '侦察车', category: 'light_attack', count: 3, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: 'PARS III APC', type: '轮式装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, initial_delay: 240 },
          { name: 'BMC-185 运输卡车', type: '运输卡车', category: 'logistics', count: 5, tickets: 6, respawn_time: 180, initial_delay: 0 },
          { name: 'BMC-185 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 6, respawn_time: 180, initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'RPG-7V2', secondary: 'G17', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'MG3', secondary: 'G17', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'KNT-76', secondary: 'G17', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
      {
        key: 'tlf-armored',
        name: '装甲旅编制',
        type: '装甲',
        type_key: 'armored',
        type_icon: NATO_ICON('armored', '#c0392b'),
        description:
          '土军装甲突击力量，M60T 主战坦克为核心，配合步战车遂行装甲突破。',
        tactics: {
          role: '装甲突击 / 反装甲',
          strengths: ['坦克火力强', '装甲防护可靠'],
          weaknesses: ['载具昂贵', '损失惩罚高'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察', 'TB-2无人机'],
        vehicles: [
          { name: 'M60T', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 1200, initial_delay: 900, note: '120mm滑膛炮，现代化改装' },
          { name: 'ACV-15 IFV', type: '履带式步战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 900, initial_delay: 480 },
          { name: 'Cobra-II', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: 'BMC-185 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 6, respawn_time: 180, initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'Carl Gustaf M2', secondary: 'G17', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'MG3', secondary: 'G17', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'MPT-76', secondary: 'G17', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'tlf-airassault',
        name: '空降编制',
        type: '空降',
        type_key: 'airassault',
        type_icon: NATO_ICON('airassault', '#c0392b'),
        description:
          '土军空中突击编制，UH-60 与 UH-1H 直升机投送步兵，山地快速夺点。',
        tactics: {
          role: '空中突击 / 山地夺点',
          strengths: ['投送迅速', '适合山地作战'],
          weaknesses: ['直升机风险高', '重装备有限'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'UH-60', type: '运输直升机', category: 'helicopter', count: 2, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/us_uh60.png', initial_delay: 360 },
          { name: 'UH-1H', type: '轻型直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, initial_delay: 360 },
          { name: 'Cobra-II', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: 'BMC-185 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 6, respawn_time: 180, initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'Carl Gustaf M2', secondary: 'G17', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'MG3', secondary: 'G17', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'KNT-76', secondary: 'G17', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
    ],
  },
  {
    code: 'GFI',
    name: '伊朗',
    flag_url: FLAGS.GFI,
    theme: '#2f7d4f', // 沙漠绿
    soldier_weapons: SOLDIER_WEAPONS.GFI,
    rosters: [
      {
        key: 'gfi-mechanized',
        name: '机械化编制',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#2f7d4f'),
        description:
          '伊朗精锐机械化编制，苏式步战车与国产改装混编，火力配置凶悍。',
        tactics: {
          role: '正面突击 / 城市攻坚',
          strengths: ['火力强大', '载具种类丰富'],
          weaknesses: ['后勤保障要求高', '防护参差不齐'],
        },
        commander_abilities: ['122mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'BMP-1', type: '步兵战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/mea_bmp1.png', initial_delay: 420, note: '73mm炮' },
          { name: 'BTR-80', type: '装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/rus_btr80.png', initial_delay: 180 },
          { name: 'BRDM-2', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, initial_delay: 0, note: '可挂UB-32火箭巢' },
          { name: '乌拉尔-4320 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
          { name: '乌拉尔-4320 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'RPG-7V2', secondary: 'Hi-Power', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'Hi-Power', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'SVD', secondary: 'Hi-Power', gear: ['2x 破片手雷', '测距仪'], special: 'PSO-1瞄准镜' },
        ],
      },
      {
        key: 'gfi-motorized',
        name: '摩托化编制',
        type: '摩托化',
        type_key: 'motorized',
        type_icon: NATO_ICON('motorized', '#2f7d4f'),
        description:
          '以轮式装甲车与皮卡改装的快速机动编制，擅长沙漠机动与袭扰。',
        tactics: {
          role: '沙漠机动 / 袭扰',
          strengths: ['机动灵活', '载具成本低'],
          weaknesses: ['装甲薄弱', '火力持续性差'],
        },
        commander_abilities: ['122mm炮兵支援'],
        vehicles: [
          { name: 'BRDM-2', type: '侦察车', category: 'light_attack', count: 3, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: 'BTR-80', type: '装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/rus_btr80.png', initial_delay: 180 },
          { name: '乌拉尔-4320 运输卡车', type: '运输卡车', category: 'logistics', count: 5, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
          { name: '乌拉尔-4320 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'RPG-7V2', secondary: 'Hi-Power', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'MG3', secondary: 'Hi-Power', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'SVD', secondary: 'Hi-Power', gear: ['2x 破片手雷', '测距仪'], special: 'PSO-1瞄准镜' },
        ],
      },
      {
        key: 'gfi-armored',
        name: '装甲旅编制',
        type: '装甲',
        type_key: 'armored',
        type_icon: NATO_ICON('armored', '#2f7d4f'),
        description:
          '伊朗装甲突击力量，T-72 系列主战坦克为主力，具备独立装甲突破能力。',
        tactics: {
          role: '装甲突击 / 反装甲',
          strengths: ['坦克数量充足', '火力凶猛'],
          weaknesses: ['信息化水平低', '损失惩罚高'],
        },
        commander_abilities: ['122mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'T-72S', type: '主战坦克', category: 'tank', count: 3, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/rus_t72.png', initial_delay: 900, note: '125mm滑膛炮' },
          { name: 'BMP-1', type: '步兵战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/mea_bmp1.png', initial_delay: 420 },
          { name: 'BRDM-2', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: '乌拉尔-4320 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'RPG-7V2', secondary: 'Hi-Power', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'Hi-Power', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'G3A3', secondary: 'Hi-Power', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'gfi-light',
        name: '轻步兵编制',
        type: '轻步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#2f7d4f'),
        description:
          '伊朗轻步兵编制，熟悉沙漠地形，以徒步机动和伏击战术为主。',
        tactics: {
          role: '沙漠伏击 / 据点防御',
          strengths: ['地形熟悉度高', '伏击战术熟练', '票数风险低'],
          weaknesses: ['缺乏重火力', '无装甲支援'],
        },
        commander_abilities: ['122mm炮兵支援'],
        vehicles: [
          { name: 'BRDM-2', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: '乌拉尔-4320 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
          { name: '乌拉尔-4320 补给卡车', type: '补给卡车', category: 'logistics', count: 1, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'RPG-7V2', secondary: 'Hi-Power', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'Hi-Power', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'SVD', secondary: 'Hi-Power', gear: ['2x 破片手雷', '测距仪'], special: 'PSO-1瞄准镜' },
        ],
      },
    ],
  },
  {
    code: 'IMF',
    name: '塞尔维亚民兵/车臣',
    flag_url: FLAGS.IMF,
    theme: '#8a8a5c', // 土黄
    soldier_weapons: SOLDIER_WEAPONS.IMF,
    rosters: [
      {
        key: 'imf-light',
        name: '轻步兵编制',
        type: '轻步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#8a8a5c'),
        description:
          '非正规武装编制，装备老旧但数量庞大，擅长游击战与城市巷战，载具以民用改装车为主。',
        tactics: {
          role: '游击战 / 城市巷战 / 伏击',
          strengths: ['票数消耗极低', 'IED等非常规手段', '熟悉地形'],
          weaknesses: ['装备老旧', '缺乏装甲力量', '远程火力不足'],
        },
        commander_abilities: ['迫击炮支援'],
        vehicles: [
          { name: '皮卡 ZU-23', type: '技术车辆', category: 'light_attack', count: 2, tickets: 5, respawn_time: 180, icon_url: '/squad-assets/vehicles/imf_technical.png', initial_delay: 120, note: '23mm高射炮改装' },
          { name: '皮卡 运输型', type: '运输卡车', category: 'logistics', count: 4, tickets: 2, respawn_time: 180, icon_url: '/squad-assets/vehicles/imf_technical.png', initial_delay: 0 },
          { name: '民用补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 2, respawn_time: 180, initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'RPG-7', secondary: 'TT-33', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7L破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'RPK', secondary: 'TT-33', gear: ['2x 破片手雷'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 3, primary: 'AKM', secondary: 'TT-33', gear: ['破片手雷', '修理工具'], special: 'IED简易爆炸装置' },
        ],
      },
      {
        key: 'imf-motorized',
        name: '摩托化编制',
        type: '摩托化',
        type_key: 'motorized',
        type_icon: NATO_ICON('motorized', '#8a8a5c'),
        description:
          '民兵摩托化突击力量，以改装皮卡和缴获车辆快速穿插，执行打了就跑的袭扰战术。',
        tactics: {
          role: '袭扰 / 快速穿插',
          strengths: ['机动灵活', '战术难以预测'],
          weaknesses: ['防护几乎为零', '火力持续性差'],
        },
        commander_abilities: ['迫击炮支援'],
        vehicles: [
          { name: '皮卡 重机枪型', type: '技术车辆', category: 'light_attack', count: 3, tickets: 5, respawn_time: 180, icon_url: '/squad-assets/vehicles/imf_technical.png', initial_delay: 0 },
          { name: '皮卡 ZU-23', type: '技术车辆', category: 'light_attack', count: 1, tickets: 5, respawn_time: 180, icon_url: '/squad-assets/vehicles/imf_technical.png', initial_delay: 120 },
          { name: '皮卡 运输型', type: '运输卡车', category: 'logistics', count: 4, tickets: 2, respawn_time: 180, icon_url: '/squad-assets/vehicles/imf_technical.png', initial_delay: 0 },
          { name: '民用补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 2, respawn_time: 180, initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'RPG-7', secondary: 'TT-33', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7L破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'RPK', secondary: 'TT-33', gear: ['2x 破片手雷'], special: '两脚架' },
        ],
      },
    
      {
        key: 'imf-mechanized',
        name: '哥萨克第1独立旅',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#8a8a5c'),
        description: '- 指挥官可以使用载具来部署指挥官技能',
        tactics: {
          role: '正面突击 / 装甲协同',
          strengths: ['载具火力强', '步兵与载具协同好'],
          weaknesses: ['编造成本高', '对反载具火力敏感'],
        },
        commander_abilities: ['便携无人机', '120mm 重型迫击炮火力支援'],
        vehicles: [
          { name: '乌拉尔-375D 运输车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
          { name: 'Ural-375D 运输车', type: '运输卡车', category: 'logistics', count: 1, tickets: 0, initial_delay: 0 },
          { name: 'MT-LB 补给载具', type: '装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 360, initial_delay: 180 },
          { name: 'BMP-1 步兵战车', type: '步兵战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/mea_bmp1.png', initial_delay: 480 },
          { name: 'BMP-2 步兵战车', type: '步兵战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/rus_bmp2.png', initial_delay: 480, note: '30mm机炮 + 反坦克导弹' },
          { name: 'MT-LB（ZU-23-2）', type: '装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 360, initial_delay: 180 },
          { name: '乌拉尔-375D BM-21"冰雹"', type: '火炮', category: 'artillery', count: 4, tickets: 8, respawn_time: 600, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
          { name: 'T-72A 主战坦克', type: '主战坦克', category: 'tank', count: 1, tickets: 15, respawn_time: 1200, initial_delay: 0 },
        ],
        specialist_kits: [{"name": "重筒", "type": "反载具", "limit": 2, "primary": "RPG-7", "secondary": "TT-33", "gear": ["2x 破片手雷", "烟雾弹"], "special": "PG-7L破甲弹"}, {"name": "通用机枪", "type": "火力支援", "limit": 2, "primary": "RPK", "secondary": "TT-33", "gear": ["2x 破片手雷"], "special": "两脚架"}, {"name": "工兵", "type": "工程", "limit": 3, "primary": "AKM", "secondary": "TT-33", "gear": ["破片手雷", "修理工具"], "special": "IED简易爆炸装置"}],
      },
],
  },
  {
    code: 'MEI',
    name: '中东叛军/老乡',
    flag_url: FLAGS.MEI,
    theme: '#5c5c5c', // 灰
    soldier_weapons: SOLDIER_WEAPONS.MEI,
    rosters: [
      {
        key: 'mei-light',
        name: '轻步兵编制',
        type: '轻步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#5c5c5c'),
        description:
          '抵抗组织编制，全部依靠缴获与黑市装备，隐蔽性强，专精非常规战争。',
        tactics: {
          role: '伏击 / 骚扰 / 防御',
          strengths: ['隐蔽性极强', '非常规战术', '低票数风险'],
          weaknesses: ['装备匮乏', '无正规载具', '火力密度低'],
        },
        commander_abilities: ['简易迫击炮支援'],
        vehicles: [
          { name: '民用皮卡', type: '运输卡车', category: 'logistics', count: 3, tickets: 2, respawn_time: 180, icon_url: '/squad-assets/vehicles/imf_technical.png', initial_delay: 0 },
          { name: '民用补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 2, respawn_time: 180, initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'RPG-7', secondary: 'TT-33', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7L破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'RPK', secondary: 'TT-33', gear: ['2x 破片手雷'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 3, primary: 'AKM', secondary: 'TT-33', gear: ['破片手雷'], special: 'IED简易爆炸装置' },
        ],
      },
      {
        key: 'mei-motorized',
        name: '摩托化编制',
        type: '摩托化',
        type_key: 'motorized',
        type_icon: NATO_ICON('motorized', '#5c5c5c'),
        description:
          '叛军摩托化力量，技术车辆与缴获装甲混编，机动袭扰与伏击兼备。',
        tactics: {
          role: '机动袭扰 / 伏击',
          strengths: ['技术车辆多样', '机动灵活'],
          weaknesses: ['防护薄弱', '缺乏重火力'],
        },
        commander_abilities: ['简易迫击炮支援'],
        vehicles: [
          { name: '技术车 DShK', type: '技术车辆', category: 'light_attack', count: 2, tickets: 5, respawn_time: 180, icon_url: '/squad-assets/vehicles/imf_technical.png', initial_delay: 0, note: '12.7mm重机枪' },
          { name: '技术车 SPG-9', type: '技术车辆', category: 'light_attack', count: 1, tickets: 5, respawn_time: 180, icon_url: '/squad-assets/vehicles/imf_technical.png', initial_delay: 120, note: '73mm无后坐力炮' },
          { name: 'BRDM-2', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: '乌拉尔-375D 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'RPG-7', secondary: 'TT-33', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7L破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'TT-33', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
        ],
      },
      {
        key: 'mei-mechanized',
        name: '机械化编制',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#5c5c5c'),
        description:
          '叛军精锐机械化力量，缴获的 BMP 步战车与 MT-LB 装甲车组成突击矛头。',
        tactics: {
          role: '装甲突击 / 据点攻坚',
          strengths: ['缴获装甲火力强', '出其不意'],
          weaknesses: ['装备维护差', '后勤保障弱'],
        },
        commander_abilities: ['简易迫击炮支援'],
        vehicles: [
          { name: 'BMP-1', type: '步兵战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/mea_bmp1.png', initial_delay: 420 },
          { name: 'MT-LB', type: '装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 360, initial_delay: 180 },
          { name: 'BTR-80', type: '装甲运兵车', category: 'apc', count: 1, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/rus_btr80.png', initial_delay: 180 },
          { name: '技术车 DShK', type: '技术车辆', category: 'light_attack', count: 2, tickets: 5, respawn_time: 180, icon_url: '/squad-assets/vehicles/imf_technical.png', initial_delay: 0 },
          { name: '乌拉尔-375D 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'RPG-7', secondary: 'TT-33', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7L破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'TT-33', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'AKM', secondary: 'TT-33', gear: ['破片手雷', '修理工具'], special: 'IED简易爆炸装置' },
        ],
      },
      {
        key: 'mei-armored',
        name: '装甲旅编制',
        type: '装甲',
        type_key: 'armored',
        type_icon: NATO_ICON('armored', '#5c5c5c'),
        description:
          '叛军装甲力量，缴获的 T-62 主战坦克组成冲击核心，罕见但极具威胁。',
        tactics: {
          role: '装甲冲击 / 反装甲',
          strengths: ['坦克火力强', '威慑力大'],
          weaknesses: ['数量稀少', '维护极差', '损失惩罚高'],
        },
        commander_abilities: ['简易迫击炮支援'],
        vehicles: [
          { name: 'T-62', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 1200, initial_delay: 900, note: '115mm滑膛炮，缴获老式坦克' },
          { name: 'BMP-1', type: '步兵战车', category: 'ifv', count: 1, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/mea_bmp1.png', initial_delay: 420 },
          { name: 'MT-LB', type: '装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 360, initial_delay: 180 },
          { name: '乌拉尔-375D 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'RPG-7', secondary: 'TT-33', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7L破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'TT-33', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'AKM', secondary: 'TT-33', gear: ['破片手雷', '修理工具'], special: 'IED简易爆炸装置' },
        ],
      },
    ],
  },
  {
    code: 'CRF',
    name: '加拿大叛军',
    flag_url: FLAGS.CRF,
    theme: '#3a3a3a', // 深灰
    soldier_weapons: SOLDIER_WEAPONS.CRF,
    rosters: [
      {
        key: 'crf-light',
        name: '轻步兵编制',
        type: '轻步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#3a3a3a'),
        description:
          '加拿大抵抗组织编制，混用老式猎枪与缴获制式武器，擅长丛林伏击与非常规战争。',
        tactics: {
          role: '丛林伏击 / 非常规战争',
          strengths: ['隐蔽性强', '武器混杂难预判', '票数风险低'],
          weaknesses: ['装备杂乱', '缺乏装甲力量'],
        },
        commander_abilities: ['迫击炮支援'],
        vehicles: [
          { name: '皮卡 运输型', type: '运输卡车', category: 'logistics', count: 3, tickets: 2, respawn_time: 180, icon_url: '/squad-assets/vehicles/imf_technical.png', initial_delay: 0 },
          { name: 'M939 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: 'M1151 M240', type: '轻型装甲车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m1151.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'M72A7 LAW', secondary: 'G17', gear: ['2x 破片手雷', '烟雾弹'], special: '一次性火箭筒' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'C6', secondary: 'G17', gear: ['2x 破片手雷'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 2, primary: 'M21', secondary: 'G17', gear: ['2x 破片手雷', '测距仪'], special: '高倍率瞄准镜' },
          { name: '工兵', type: '工程', limit: 3, primary: 'C7A2', secondary: 'G17', gear: ['破片手雷', '修理工具'], special: 'IED简易爆炸装置' },
        ],
      },
      {
        key: 'crf-motorized',
        name: '摩托化编制',
        type: '摩托化',
        type_key: 'motorized',
        type_icon: NATO_ICON('motorized', '#3a3a3a'),
        description:
          '叛军摩托化力量，混用民用皮卡与缴获军车，快速穿插袭扰。',
        tactics: {
          role: '快速袭扰 / 机动伏击',
          strengths: ['机动灵活', '车辆来源多样'],
          weaknesses: ['防护薄弱', '火力有限'],
        },
        commander_abilities: ['迫击炮支援'],
        vehicles: [
          { name: '技术车 M2', type: '技术车辆', category: 'light_attack', count: 2, tickets: 5, respawn_time: 180, icon_url: '/squad-assets/vehicles/imf_technical.png', initial_delay: 0, note: '12.7mm重机枪' },
          { name: 'M113A3', type: '装甲运兵车', category: 'apc', count: 1, tickets: 5, respawn_time: 600, initial_delay: 240, note: '缴获老式装甲车' },
          { name: 'Coyote', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: 'M939 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'M3 MAAWS', secondary: 'G17', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'C6', secondary: 'G17', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
        ],
      },
    ],
  },
  {
    code: 'WPMC',
    name: '西方黑水安保部队',
    flag_url: FLAGS.WPMC,
    theme: '#1a1a2e', // 黑水黑
    soldier_weapons: SOLDIER_WEAPONS.WPMC,
    rosters: [
      {
        key: 'wpmc-light',
        name: '轻步兵编制',
        type: '轻步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#1a1a2e'),
        description:
          '私营军事承包商轻装编制，雇佣兵素质高，装备西式定制武器，擅长快反与安保任务。',
        tactics: {
          role: '快速反应 / 安保护航',
          strengths: ['单兵素质高', '定制武器精度好'],
          weaknesses: ['缺乏重装甲', '人员成本高'],
        },
        commander_abilities: [
        'F-16 火箭弹打击',
        '120mm 重型迫击炮火力支援',
        '便携无人机',
],
        vehicles: [
          { name: '四轮摩托车', type: '运输卡车', category: 'logistics', count: 1, tickets: 0, initial_delay: 0 },
          { name: 'M939 运兵卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: '护卫载具（运兵型）', type: '运输卡车', category: 'logistics', count: 1, tickets: 5, initial_delay: 0 },
          { name: 'M939 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 5, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
          { name: '改装皮卡补给车', type: '补给卡车', category: 'logistics', count: 1, tickets: 0, initial_delay: 0 },
          { name: '护卫载具（M134 转轮机枪）', type: '技术车辆', category: 'light_attack', count: 2, tickets: 5, respawn_time: 180, icon_url: '/squad-assets/vehicles/imf_technical.png', initial_delay: 0, note: '7.62mm米尼岗' },
          { name: '改装皮卡车（M2）', type: '轻型装甲车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m1151.png', initial_delay: 0 },
          { name: 'M1117 装甲车', type: '轻型装甲车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, initial_delay: 0, note: '12.7mm重机枪' },
          { name: 'M1151 陶氏反坦克导弹', type: '轻型装甲车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m1151.png', initial_delay: 0 },
          { name: 'M113A3 机动支援载具', type: '火炮', category: 'artillery', count: 2, tickets: 20, respawn_time: 600, initial_delay: 240 },
          { name: '改装皮卡车（迫击炮）', type: '火炮', category: 'artillery', count: 2, tickets: 5, initial_delay: 0 },
          { name: 'OH-6A"泥鳅"轻型突击型', type: '运输直升机', category: 'helicopter', count: 1, tickets: 10, respawn_time: 360, initial_delay: 0 },
          { name: '渡鸦（运兵型）', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, initial_delay: 0 },
],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'M136 AT-4', secondary: 'M9A1', gear: ['2x 破片手雷', '烟雾弹'], special: '一次性火箭筒' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9A1', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 2, primary: 'HK417', secondary: 'M9A1', gear: ['2x 破片手雷', '测距仪'], special: '高倍率瞄准镜' },
        ],
      },
      {
        key: 'wpmc-motorized',
        name: '摩托化编制',
        type: '摩托化',
        type_key: 'motorized',
        type_icon: NATO_ICON('motorized', '#1a1a2e'),
        description:
          'PMC 快速机动编制，技术车辆与轻型装甲混编，擅长护航与巡逻。',
        tactics: {
          role: '护航 / 巡逻 / 快速部署',
          strengths: ['机动灵活', '载具改装多样'],
          weaknesses: ['装甲薄弱', '攻坚能力有限'],
        },
        commander_abilities: ['无人机侦察'],
        vehicles: [
          { name: '技术车 M134', type: '技术车辆', category: 'light_attack', count: 2, tickets: 5, respawn_time: 180, icon_url: '/squad-assets/vehicles/imf_technical.png', initial_delay: 0, note: '7.62mm米尼岗' },
          { name: 'M1117', type: '轻型装甲车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, initial_delay: 0, note: '12.7mm重机枪' },
          { name: 'M1151 TOW', type: '反坦克车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m1151.png', initial_delay: 120, note: 'TOW反坦克导弹' },
          { name: 'M939 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'M136 AT-4', secondary: 'M9A1', gear: ['2x 破片手雷', '烟雾弹'], special: '一次性火箭筒' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9A1', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'M21', secondary: 'M9A1', gear: ['2x 破片手雷', '测距仪'], special: '高倍率瞄准镜' },
        ],
      },
      {
        key: 'wpmc-airassault',
        name: '空降编制',
        type: '空降',
        type_key: 'airassault',
        type_icon: NATO_ICON('airassault', '#1a1a2e'),
        description:
          'PMC 空中突击力量，Loach 侦察直升机与 Raven 运输直升机配合，快速投送雇佣兵。',
        tactics: {
          role: '空中突击 / 快速夺点',
          strengths: ['投送迅速', '直升机灵活'],
          weaknesses: ['直升机风险高', '缺乏重装备'],
        },
        commander_abilities: ['无人机侦察', 'F-16近距空中支援'],
        vehicles: [
          { name: 'Raven CH-146', type: '运输直升机', category: 'helicopter', count: 2, tickets: 5, respawn_time: 600, initial_delay: 360, note: '主力投送平台' },
          { name: 'Loach Scout', type: '侦察直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, initial_delay: 360 },
          { name: 'CPV', type: '轻型突击车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 180, initial_delay: 0 },
          { name: 'M939 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'Carl Gustaf M2', secondary: 'M9A1', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9A1', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'HK417', secondary: 'M9A1', gear: ['2x 破片手雷', '测距仪'], special: '高倍率瞄准镜' },
        ],
      },
      {
        key: 'wpmc-combined',
        name: '合成营编制',
        type: '合成',
        type_key: 'combined',
        type_icon: NATO_ICON('combined', '#1a1a2e'),
        description:
          'PMC 综合合成力量，M60T 坦克与 M113 装甲车混编，独立遂行多样化任务。',
        tactics: {
          role: '多样化作战 / 独立行动',
          strengths: ['兵种配置灵活', '适应性强'],
          weaknesses: ['载具来源混杂', '后勤复杂'],
        },
        commander_abilities: ['无人机侦察', 'F-16近距空中支援'],
        vehicles: [
          { name: 'M60T', type: '主战坦克', category: 'tank', count: 1, tickets: 15, respawn_time: 1200, initial_delay: 900, note: '120mm滑膛炮' },
          { name: 'M113A3', type: '装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, initial_delay: 240 },
          { name: 'M1117', type: '轻型装甲车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: '技术车 M2', type: '技术车辆', category: 'light_attack', count: 2, tickets: 5, respawn_time: 180, icon_url: '/squad-assets/vehicles/imf_technical.png', initial_delay: 0 },
          { name: 'M939 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/us_m939.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'Carl Gustaf M2', secondary: 'M9A1', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9A1', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'M21', secondary: 'M9A1', gear: ['2x 破片手雷', '测距仪'], special: '高倍率瞄准镜' },
          { name: '工兵', type: '工程', limit: 2, primary: 'M4', secondary: 'M9A1', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
    ],
  },
]

/* ═══════════ 载具分类元数据（用于筛选） ═══════════ */

export const VEHICLE_CATEGORIES = {
  all: { label: '全部', icon: '🗂️' },
  tank: { label: '坦克', icon: '🛡️' },
  ifv: { label: '步战车', icon: '🚜' },
  apc: { label: '装甲运兵车', icon: '🚐' },
  light_attack: { label: '侦察/突击', icon: '🚙' },
  logistics: { label: '运输/补给', icon: '🚛' },
  helicopter: { label: '直升机', icon: '🚁' },
  artillery: { label: '火炮', icon: '💣' },
}

/** 编制类型显示标签（7 种完整编制） */
export const BG_TYPE_LABELS = {
  light_infantry: '轻步兵',
  motorized: '摩托化',
  mechanized: '机械化',
  armored: '装甲',
  combined: '合成',
  airassault: '空降',
  support: '支援',
}

/** 票数 → 风险等级 */
export function ticketsLevel(t) {
  if (t >= 10) return { level: 'high', label: '高价值', color: '#ff4d4f' }
  if (t >= 5) return { level: 'mid', label: '中等', color: '#fa8c16' }
  return { level: 'low', label: '低', color: '#52c41a' }
}

/** 复活时间 → 等级（秒） */
export function respawnLevel(s) {
  if (s >= 900) return { level: 'long', label: '长', color: '#ff4d4f' }
  if (s >= 420) return { level: 'mid', label: '中', color: '#faad14' }
  return { level: 'short', label: '短', color: '#52c41a' }
}

/** 格式化秒数 → mm:ss */
export function fmtTime(seconds) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s.toString().padStart(2, '0')}秒`
}

/** 工具：按阵营code + 编制key 查找 */
export function findRoster(factionCode, rosterKey) {
  const faction = FACTIONS.find((f) => f.code === factionCode)
  if (!faction) return null
  const roster = faction.rosters.find((r) => r.key === rosterKey)
  return roster ? { faction, roster } : null
}

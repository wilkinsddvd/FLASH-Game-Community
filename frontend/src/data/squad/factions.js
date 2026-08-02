/**
 * 《战术小队》阵营编制数据（静态数据层）
 * 字段定义遵循 需求文档（PRD）v1.0 的 JSON Schema
 *
 * ⚠️ 数据说明：
 * - 本文件为演示/占位数据，票数、复活时间等参数需按游戏当前版本（Patch Notes + Squad Wiki）校对
 * - 数据更新机制：每次游戏大版本更新后同步更新本文件
 * - 旗帜/图标为简化 SVG 占位，正式上线可替换为 /assets/ 下的图片资源
 */

/* ═══════════ SVG 生成工具 ═══════════ */

const svgDataUri = (body, w = 60, h = 40) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`
  )}`

/** 阵营旗帜（简化版 SVG，60x40） */
const FLAGS = {
  USMC: svgDataUri(
    '<rect width="60" height="40" fill="#a6192e"/><circle cx="30" cy="20" r="12" fill="none" stroke="#c9a227" stroke-width="2.5"/><path d="M18 26 L42 26 L38 32 L22 32 Z" fill="#c9a227"/><path d="M24 26 v-6 a6 6 0 0 1 12 0 v6" fill="none" stroke="#c9a227" stroke-width="2"/>'
  ),
  USA: svgDataUri(
    '<rect width="60" height="40" fill="#b22234"/>' +
      Array.from({ length: 6 }, (_, i) => `<rect y="${3 + i * 6}" width="60" height="3" fill="#fff"/>`).join('') +
      '<rect width="26" height="22" fill="#3c3b6e"/><circle cx="5" cy="5" r="1.1" fill="#fff"/><circle cx="13" cy="5" r="1.1" fill="#fff"/><circle cx="21" cy="5" r="1.1" fill="#fff"/><circle cx="9" cy="11" r="1.1" fill="#fff"/><circle cx="17" cy="11" r="1.1" fill="#fff"/><circle cx="5" cy="17" r="1.1" fill="#fff"/><circle cx="13" cy="17" r="1.1" fill="#fff"/><circle cx="21" cy="17" r="1.1" fill="#fff"/>'
  ),
  RUS: svgDataUri(
    '<rect width="60" height="13.3" fill="#fff"/><rect y="13.3" width="60" height="13.3" fill="#0039a6"/><rect y="26.6" width="60" height="13.4" fill="#d52b1e"/>'
  ),
  UK: svgDataUri(
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
  MEA: svgDataUri(
    '<rect width="60" height="40" fill="#1a5c2e"/><path d="M30 8 a12 12 0 1 0 0 24 a10 10 0 1 1 0 -24" fill="#fff"/><circle cx="38" cy="20" r="2.2" fill="#1a5c2e"/>'
  ),
  IMF: svgDataUri(
    '<rect width="60" height="40" fill="#6b6b3c"/><path d="M30 6 L36 18 L48 19 L39 28 L42 40 L30 33 L18 40 L21 28 L12 19 L24 18 Z" fill="#1c1c10"/>'
  ),
  INS: svgDataUri(
    '<rect width="60" height="40" fill="#151515"/><path d="M30 6 L40 34 L30 28 L20 34 Z" fill="#a6192e"/>'
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
    support:
      '<rect x="4" y="8" width="24" height="16" fill="none" stroke="COLOR" stroke-width="2.5"/><line x1="4" y1="14" x2="28" y2="14" stroke="COLOR" stroke-width="1.5"/>',
  }
  const body = (shapes[type] || shapes.light_infantry).split('COLOR').join(C)
  return svgDataUri(body, 32, 32)
}

/* ═══════════ 阵营数据 ═══════════ */

export const FACTIONS = [
  {
    code: 'USMC',
    name: '美国海军陆战队',
    flag_url: FLAGS.USMC,
    theme: '#b8860b', // 陆战队金
    rosters: [
      {
        key: 'usmc-mechanized',
        name: '第1陆战团第1营',
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
        commander_abilities: ['155mm炮兵支援', '无人机侦察', 'A-10近距空中支援'],
        vehicles: [
          { name: 'M2A3 Bradley', type: '步兵战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/usmc_m2a3.png', initial_delay: 600, note: '25mm机炮 + TOW反坦克导弹' },
          { name: 'M-ATV M240', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0, note: '7.62mm机枪，快速侦察平台' },
          { name: 'UH-60 Black Hawk', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/us_uh60.png', initial_delay: 360, note: '可搭载完整步兵班快速投送' },
          { name: 'MTVR 7吨运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, initial_delay: 0 },
          { name: 'MTVR 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'M3 MAAWS', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹', '绷带x2'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'M110 SASS', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '榴弹兵', type: '火力支援', limit: 1, primary: 'M4A1 + M320', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '40mm高爆榴弹x6' },
        ],
      },
      {
        key: 'usmc-motorized',
        name: '第3陆战团第2营',
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
        commander_abilities: ['155mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'LAV-25', type: '轮式步战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/usmc_lav25.png', initial_delay: 300, note: '25mm机炮，机动火力兼备' },
          { name: 'M-ATV M2', type: '侦察车', category: 'light_attack', count: 3, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'JLTV', type: '轻型装甲车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, initial_delay: 120 },
          { name: 'MTVR 7吨运输卡车', type: '运输卡车', category: 'logistics', count: 5, tickets: 8, respawn_time: 180, initial_delay: 0 },
          { name: 'MTVR 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'AT4', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '一次性火箭筒' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'M110 SASS', secondary: 'M9', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
      {
        key: 'usmc-light',
        name: '第5陆战团第1营',
        type: '轻型步兵',
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
          { name: 'MTVR 7吨运输卡车', type: '运输卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, initial_delay: 0 },
          { name: 'MTVR 补给卡车', type: '补给卡车', category: 'logistics', count: 1, tickets: 8, respawn_time: 180, initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'M3 MAAWS', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 2, primary: 'M110 SASS', secondary: 'M9', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '工兵', type: '工程', limit: 2, primary: 'M4A1', secondary: 'M9', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'usmc-armored',
        name: '第2坦克营',
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
        commander_abilities: ['155mm炮兵支援', '无人机侦察', 'A-10近距空中支援'],
        vehicles: [
          { name: 'M1A1 Abrams', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/usmc_m1a1.png', initial_delay: 900, note: '120mm滑膛炮，全编制最强装甲' },
          { name: 'AAVP-7A1', type: '两栖装甲运兵车', category: 'apc', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/usmc_aavp.png', initial_delay: 240, note: '12.7mm重机枪，可两栖投送步兵' },
          { name: 'M-ATV M2', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'MTVR 7吨运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, initial_delay: 0 },
          { name: 'MTVR 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'M3 MAAWS', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'M4A1', secondary: 'M9', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'usmc-combined',
        name: '陆战远征队合成营',
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
        commander_abilities: ['155mm炮兵支援', '无人机侦察', 'A-10近距空中支援'],
        vehicles: [
          { name: 'M1A1 Abrams', type: '主战坦克', category: 'tank', count: 1, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/usmc_m1a1.png', initial_delay: 900 },
          { name: 'M2A3 Bradley', type: '步兵战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/usmc_m2a3.png', initial_delay: 600 },
          { name: 'LAV-25', type: '轮式步战车', category: 'ifv', count: 1, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/usmc_lav25.png', initial_delay: 300 },
          { name: 'UH-60 Black Hawk', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/us_uh60.png', initial_delay: 360 },
          { name: 'M-ATV M240', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'MTVR 7吨运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'M3 MAAWS', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'M110 SASS', secondary: 'M9', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '工兵', type: '工程', limit: 2, primary: 'M4A1', secondary: 'M9', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
    ],
  },
  {
    code: 'USA',
    name: '美国陆军',
    flag_url: '/squad-assets/flags/usa.png',
    theme: '#4a7c2f', // 陆军绿
    rosters: [
      {
        key: 'usa-mechanized',
        name: '第1装甲师第2旅',
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
        commander_abilities: ['155mm炮兵支援', '无人机侦察', 'A-10近距空中支援'],
        vehicles: [
          { name: 'M2A3 Bradley', type: '步兵战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/usmc_m2a3.png', initial_delay: 600 },
          { name: 'M1126 Stryker', type: '轮式装甲运兵车', category: 'apc', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/us_m1126.png', initial_delay: 240 },
          { name: 'M-ATV M2', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'HEMTT 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, initial_delay: 0 },
          { name: 'HEMTT 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, initial_delay: 0 },
          { name: 'UH-60 Black Hawk', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/us_uh60.png', initial_delay: 360 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'M3 MAAWS', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹', '绷带x2'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'M110 SASS', secondary: 'M9', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '榴弹兵', type: '火力支援', limit: 1, primary: 'M4A1 + M320', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '40mm高爆榴弹x6' },
        ],
      },
      {
        key: 'usa-light',
        name: '第101空降师第1旅',
        type: '轻型步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#4a7c2f'),
        description:
          '空中突击步兵编制，强调通过直升机与轻型载具快速投送，在敌后关键地域实施突袭与占领。',
        tactics: {
          role: '空中突击 / 敌后渗透',
          strengths: ['投送速度快', '适合复杂地形', '票数风险低'],
          weaknesses: ['缺乏重装甲', '持续作战能力有限'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'UH-60 Black Hawk', type: '运输直升机', category: 'helicopter', count: 2, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/us_uh60.png', initial_delay: 360 },
          { name: 'M-ATV M2', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
          { name: 'HEMTT 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, initial_delay: 0 },
          { name: 'HEMTT 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'AT4', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '一次性火箭筒' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M249 SAW', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 2, primary: 'M110 SASS', secondary: 'M9', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
      {
        key: 'usa-support',
        name: '第3步兵师支援旅',
        type: '支援',
        type_key: 'support',
        type_icon: NATO_ICON('support', '#4a7c2f'),
        description:
          '以炮兵与后勤为核心的支援编制，M777 牵引火炮提供远距离火力压制，保障主力旅作战。',
        tactics: {
          role: '火力支援 / 后勤保障',
          strengths: ['远程火力强', '补给能力突出'],
          weaknesses: ['正面作战能力弱', '需要友军保护'],
        },
        commander_abilities: ['M777炮兵连支援', '无人机侦察', '精确制导炮弹'],
        vehicles: [
          { name: 'M777 155mm牵引炮', type: '牵引火炮', category: 'artillery', count: 2, tickets: 15, respawn_time: 1200, initial_delay: 600, note: '远程火力压制核心' },
          { name: 'HEMTT 补给卡车', type: '补给卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, initial_delay: 0 },
          { name: 'HEMTT 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, initial_delay: 0 },
          { name: 'M-ATV M240', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/us_m_atv.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'M240B', secondary: 'M9', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'M4A1', secondary: 'M9', gear: ['破片手雷', '修理工具'], special: '弹药补给包' },
        ],
      },
    ],
  },
  {
    code: 'RUS',
    name: '俄罗斯陆军',
    flag_url: '/squad-assets/flags/rus.png',
    theme: '#d03a2f', // 俄军红
    rosters: [
      {
        key: 'rus-mechanized',
        name: '第6独立坦克旅',
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
        key: 'rus-motorized',
        name: '第205独立摩托化旅',
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
        commander_abilities: ['152mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'BTR-82A', type: '轮式步战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/rus_btr82a.png', initial_delay: 300 },
          { name: 'BTR-80', type: '装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/rus_btr80.png', initial_delay: 180 },
          { name: 'Tigr-M', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/rus_tigr.png', initial_delay: 0 },
          { name: 'KamAZ-5350 运输卡车', type: '运输卡车', category: 'logistics', count: 5, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/rus_kamaz.png', initial_delay: 0 },
          { name: 'KamAZ-5350 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/rus_kamaz.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'RPG-7V2', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'MP-443', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'SVD', secondary: 'MP-443', gear: ['2x 破片手雷', '测距仪'], special: 'PSO-1瞄准镜' },
        ],
      },
      {
        key: 'rus-light',
        name: '第7空降突击师',
        type: '轻型步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#d03a2f'),
        description:
          '俄军精锐空降部队，装备轻型化的 BMD 空降战车，擅长纵深空降突击与敌后破袭。',
        tactics: {
          role: '空降突击 / 敌后破袭',
          strengths: ['战术素养高', '空降投送灵活', '轻型载具可空投'],
          weaknesses: ['装甲薄弱', '持续作战能力有限'],
        },
        commander_abilities: ['152mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'BMD-4M', type: '空降战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/rus_bmd4m.png', initial_delay: 420, note: '100mm炮，可空投' },
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
        key: 'rus-armored',
        name: '第5近卫坦克旅',
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
    code: 'UK',
    name: '英国陆军',
    flag_url: '/squad-assets/flags/uk.png',
    theme: '#3a5f9e', // 军蓝
    rosters: [
      {
        key: 'uk-mechanized',
        name: '第12装甲步兵旅',
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
        key: 'uk-light',
        name: '第3营皇家廓尔喀步枪团',
        type: '轻型步兵',
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
        key: 'uk-armored',
        name: '女王皇家枪骑兵团',
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
    name: '加拿大陆军',
    flag_url: '/squad-assets/flags/caf.png',
    theme: '#b03a2e', // 枫叶红
    rosters: [
      {
        key: 'caf-mechanized',
        name: '第1机械化旅群',
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
        commander_abilities: ['155mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'LAV 6.0', type: '轮式步战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 900, icon_url: '/squad-assets/vehicles/caf_lav6.png', initial_delay: 300, note: '25mm机炮' },
          { name: 'TAPV', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/caf_tapv.png', initial_delay: 0 },
          { name: 'MSVS 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/caf_msvs.png', initial_delay: 0 },
          { name: 'MSVS 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/caf_msvs.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'Carl Gustaf M4', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'C6 GPMG', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'C14 Timberwolf', secondary: 'Browning HP', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
      {
        key: 'caf-motorized',
        name: '第5机械化旅群',
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
        commander_abilities: ['无人机侦察'],
        vehicles: [
          { name: 'TAPV', type: '侦察车', category: 'light_attack', count: 3, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/caf_tapv.png', initial_delay: 0 },
          { name: 'MSVS 运输卡车', type: '运输卡车', category: 'logistics', count: 5, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/caf_msvs.png', initial_delay: 0 },
          { name: 'MSVS 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/caf_msvs.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'Carl Gustaf M4', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'C6 GPMG', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
        ],
      },
      {
        key: 'caf-light',
        name: '第3营皇家加拿大团',
        type: '轻型步兵',
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
    name: '中国人民解放军',
    flag_url: '/squad-assets/flags/pla.png',
    theme: '#e8b923', // 陆军黄
    rosters: [
      {
        key: 'pla-mechanized',
        name: '第112机械化师',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#e8b923'),
        description:
          '解放军现代化合成营编制，以履带式步战车为核心，信息化程度高，强调火力与机动的结合。',
        tactics: {
          role: '合成突击 / 协同作战',
          strengths: ['火力和装甲均衡', '步兵伴随能力好', '指挥协同能力强'],
          weaknesses: ['高价值载具损失惩罚大', '依赖后方补给'],
        },
        commander_abilities: ['155mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'ZBD-04A', type: '步兵战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_zbd04a.png', initial_delay: 480, note: '100mm炮 + 30mm机炮' },
          { name: 'ZSL-10', type: '轮式步战车', category: 'ifv', count: 2, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_zsl10.png', initial_delay: 300 },
          { name: '猛士 CTL-181', type: '侦察车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: '陕汽 SX2190 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: '陕汽 SX2190 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: '直-8', type: '运输直升机', category: 'helicopter', count: 1, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_z8.png', initial_delay: 360 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'PF-98 120mm火箭筒', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹', '绷带x2'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'QJY-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'QBU-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '榴弹兵', type: '火力支援', limit: 1, primary: 'QBZ-95-1 + 榴弹发射器', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '35mm高爆榴弹x6' },
        ],
      },
      {
        key: 'pla-motorized',
        name: '第127摩托化旅',
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
        commander_abilities: ['155mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'ZSL-10', type: '轮式步战车', category: 'ifv', count: 2, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_zsl10.png', initial_delay: 300 },
          { name: '猛士 CTL-181', type: '侦察车', category: 'light_attack', count: 3, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: '陕汽 SX2190 运输卡车', type: '运输卡车', category: 'logistics', count: 5, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: '陕汽 SX2190 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'PF-98 120mm火箭筒', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'QJY-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'QBU-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
        ],
      },
      {
        key: 'pla-armored',
        name: '第1装甲旅',
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
        commander_abilities: ['155mm炮兵支援', '无人机侦察', '强击机近距支援'],
        vehicles: [
          { name: 'ZTZ-99A', type: '主战坦克', category: 'tank', count: 2, tickets: 15, respawn_time: 1200, icon_url: '/squad-assets/vehicles/pla_ztz99a.png', initial_delay: 900, note: '125mm滑膛炮' },
          { name: 'ZBD-04A', type: '步兵战车', category: 'ifv', count: 2, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/pla_zbd04a.png', initial_delay: 480 },
          { name: '猛士 CTL-181', type: '侦察车', category: 'light_attack', count: 1, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: '陕汽 SX2190 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: '陕汽 SX2190 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'PF-98 120mm火箭筒', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'QJY-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '工兵', type: '工程', limit: 2, primary: 'QBZ-95-1', secondary: 'QSZ-92', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
      {
        key: 'pla-light',
        name: '第163轻型合成旅',
        type: '轻型步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#e8b923'),
        description:
          '山地轻型合成部队，以猛士车族为机动平台，适合高原与山地快速部署。',
        tactics: {
          role: '高原山地作战 / 快速部署',
          strengths: ['山地机动性好', '票数风险低'],
          weaknesses: ['缺乏重火力', '防护薄弱'],
        },
        commander_abilities: ['无人机侦察'],
        vehicles: [
          { name: '猛士 CTL-181', type: '侦察车', category: 'light_attack', count: 3, tickets: 5, respawn_time: 360, icon_url: '/squad-assets/vehicles/pla_csk131.png', initial_delay: 0 },
          { name: '陕汽 SX2190 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
          { name: '陕汽 SX2190 补给卡车', type: '补给卡车', category: 'logistics', count: 1, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/pla_ctm131.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'PF-98 120mm火箭筒', secondary: 'QSZ-92', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'QJY-88', secondary: 'QSZ-92', gear: ['2x 破片手雷'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 2, primary: 'QBU-88', secondary: 'QSZ-92', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '工兵', type: '工程', limit: 2, primary: 'QBZ-95-1', secondary: 'QSZ-92', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
    ],
  },
  {
    code: 'ADF',
    name: '澳大利亚国防军',
    flag_url: '/squad-assets/flags/adf.png',
    theme: '#2f6b4f', // 澳军绿
    rosters: [
      {
        key: 'adf-mechanized',
        name: '第1装甲团',
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
          { name: 'HX60 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
          { name: 'HX60 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
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
        name: '第2骑兵团',
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
        commander_abilities: ['无人机侦察'],
        vehicles: [
          { name: 'Bushmaster PMV', type: '防雷巡逻车', category: 'light_attack', count: 3, tickets: 5, respawn_time: 300, icon_url: '/squad-assets/vehicles/adf_bushmaster.png', initial_delay: 0 },
          { name: 'ASLAV-25', type: '轮式步战车', category: 'ifv', count: 1, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/adf_aslav.png', initial_delay: 300 },
          { name: 'HX60 运输卡车', type: '运输卡车', category: 'logistics', count: 5, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
          { name: 'HX60 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'Carl Gustaf M4', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'MAG 58', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
        ],
      },
      {
        key: 'adf-light',
        name: '第1营皇家澳大利亚团',
        type: '轻型步兵',
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
          { name: 'HX60 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
          { name: 'HX60 补给卡车', type: '补给卡车', category: 'logistics', count: 1, tickets: 6, respawn_time: 180, icon_url: '/squad-assets/vehicles/uk_manhx.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'Carl Gustaf M4', secondary: 'Browning HP', gear: ['2x 破片手雷', '烟雾弹'], special: '测距仪' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'MAG 58', secondary: 'Browning HP', gear: ['2x 破片手雷'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 2, primary: 'SR-25', secondary: 'Browning HP', gear: ['2x 破片手雷', '测距仪'], special: '可变倍率瞄准镜' },
          { name: '工兵', type: '工程', limit: 2, primary: 'F88', secondary: 'Browning HP', gear: ['破片手雷', '修理工具'], special: 'C4炸药' },
        ],
      },
    ],
  },
  {
    code: 'MEA',
    name: '中东联军',
    flag_url: FLAGS.MEA,
    theme: '#2f7d4f', // 沙漠绿
    rosters: [
      {
        key: 'mea-mechanized',
        name: '共和国卫队装甲旅',
        type: '机械化',
        type_key: 'mechanized',
        type_icon: NATO_ICON('mechanized', '#2f7d4f'),
        description:
          '中东联军精锐机械化编制，装备俄式与国产混编载具，火力配置凶悍。',
        tactics: {
          role: '正面突击 / 城市攻坚',
          strengths: ['火力强大', '载具种类丰富'],
          weaknesses: ['后勤保障要求高', '防护参差不齐'],
        },
        commander_abilities: ['122mm炮兵支援', '无人机侦察'],
        vehicles: [
          { name: 'BMP-1', type: '步兵战车', category: 'ifv', count: 3, tickets: 10, respawn_time: 600, icon_url: '/squad-assets/vehicles/mea_bmp1.png', initial_delay: 420, note: '73mm炮' },
          { name: 'BTR-80', type: '装甲运兵车', category: 'apc', count: 2, tickets: 5, respawn_time: 600, icon_url: '/squad-assets/vehicles/rus_btr80.png', initial_delay: 180 },
          { name: 'MRAP', type: '防雷车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: '乌拉尔-4320 运输卡车', type: '运输卡车', category: 'logistics', count: 4, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
          { name: '乌拉尔-4320 补给卡车', type: '补给卡车', category: 'logistics', count: 2, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 2, primary: 'RPG-7V2', secondary: 'TT-33', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'TT-33', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'SVD', secondary: 'TT-33', gear: ['2x 破片手雷', '测距仪'], special: 'PSO-1瞄准镜' },
        ],
      },
      {
        key: 'mea-light',
        name: '沙漠突击营',
        type: '轻型步兵',
        type_key: 'light_infantry',
        type_icon: NATO_ICON('light_infantry', '#2f7d4f'),
        description:
          '中东联军轻步兵编制，熟悉沙漠地形，以徒步机动和伏击战术为主。',
        tactics: {
          role: '沙漠伏击 / 据点防御',
          strengths: ['地形熟悉度高', '伏击战术熟练', '票数风险低'],
          weaknesses: ['缺乏重火力', '无装甲支援'],
        },
        commander_abilities: ['122mm炮兵支援'],
        vehicles: [
          { name: 'MRAP', type: '防雷车', category: 'light_attack', count: 2, tickets: 5, respawn_time: 360, initial_delay: 0 },
          { name: '乌拉尔-4320 运输卡车', type: '运输卡车', category: 'logistics', count: 3, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
          { name: '乌拉尔-4320 补给卡车', type: '补给卡车', category: 'logistics', count: 1, tickets: 8, respawn_time: 180, icon_url: '/squad-assets/vehicles/mea_ural4320.png', initial_delay: 0 },
        ],
        specialist_kits: [
          { name: '重筒', type: '反载具', limit: 1, primary: 'RPG-7V2', secondary: 'TT-33', gear: ['2x 破片手雷', '烟雾弹'], special: 'PG-7VR串联破甲弹' },
          { name: '通用机枪', type: '火力支援', limit: 2, primary: 'PKM', secondary: 'TT-33', gear: ['2x 破片手雷', '烟雾弹'], special: '两脚架' },
          { name: '特射', type: '侦察', limit: 1, primary: 'SVD', secondary: 'TT-33', gear: ['2x 破片手雷', '测距仪'], special: 'PSO-1瞄准镜' },
        ],
      },
    ],
  },
  {
    code: 'IMF',
    name: '非正规民兵',
    flag_url: FLAGS.IMF,
    theme: '#8a8a5c', // 土黄
    rosters: [
      {
        key: 'imf-light',
        name: '自由战士营',
        type: '轻型步兵',
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
        name: '机动突击连',
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
    ],
  },
  {
    code: 'INS',
    name: '叛军',
    flag_url: FLAGS.INS,
    theme: '#5c5c5c', // 灰
    rosters: [
      {
        key: 'ins-light',
        name: '人民起义军',
        type: '轻型步兵',
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

/** 编制类型显示标签 */
export const BG_TYPE_LABELS = {
  light_infantry: '轻型步兵',
  motorized: '摩托化',
  mechanized: '机械化',
  armored: '装甲',
  combined: '合成',
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

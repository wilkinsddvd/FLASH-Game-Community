/**
 * 载具名称规范化
 *
 * 只处理「排版差异」：空格、全/半角、引号、连字符、括号。
 * 不删型号字母/数字，避免把 M113A3 与 M113A3 M2 误合并。
 */
export function canonicalKey(name) {
  return String(name || '')
    .normalize('NFKC')
    .replace(/[\s\u3000]+/g, '')
    .replace(/[“”"'‘’]/g, '')
    .replace(/[-–—]/g, '')
    .replace(/[()（）]/g, '')
    .toUpperCase()
}

/** 从一组异写里选一个展示名：优先无首尾空格、少连续空格、非 ASCII 引号 */
export function pickDisplayName(names) {
  const score = (s) => {
    let n = 0
    if (s !== s.trim()) n += 5
    if (/\s{2,}/.test(s)) n += 3
    if (/["']/.test(s)) n += 2
    if (/[“”]/.test(s)) n -= 1
    return n
  }
  return [...names].sort((a, b) => score(a) - score(b) || a.length - b.length)[0] || ''
}

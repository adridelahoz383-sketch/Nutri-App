// js/domain/quickParse.js — entrada rapida "arroz 200 g" / "200 g arroz" / "arroz".
// ESPECIFICACION §10.4. Devuelve { query, grams } | { error }.

const NUM = String.raw`(\d+(?:[.,]\d+)?)`;
const UNIT = String.raw`(g|gr|gramos|ml|grs)?`;
const RE = new RegExp(`^\\s*(?:${NUM}\\s*${UNIT}\\s+)?(.+?)(?:\\s+${NUM}\\s*${UNIT})?\\s*$`, 'i');

const toNum = s => s == null ? null : parseFloat(s.replace(',', '.'));

export function parseQuickInput(str) {
  if (typeof str !== 'string' || !str.trim()) return { error: 'empty' };
  const m = RE.exec(str.trim());
  if (!m) return { error: 'parse' };
  const [, n1, , query, n2] = m;
  if (n1 != null && n2 != null) return { error: 'two_amounts' };
  if (!query || !query.trim()) return { error: 'empty' };
  const grams = toNum(n1 ?? n2);
  if (grams !== null && !(grams > 0)) return { error: 'amount_invalid' };
  return { query: query.trim(), grams };
}

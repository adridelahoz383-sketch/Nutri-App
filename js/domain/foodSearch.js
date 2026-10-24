// js/domain/foodSearch.js — busqueda tolerante a tildes/mayusculas. ESPECIFICACION §10.3.

export function normalize(str) {
  return String(str ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Distancia de Levenshtein (para typo de 1 letra en palabras >= 5).
function levenshtein(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 99;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[m][n];
}

// Indice: [{ food, terms: [nameNorm, ...aliasesNorm] }]
export function buildIndex(foods) {
  return foods.map(food => ({
    food,
    terms: [normalize(food.name), ...(food.aliases ?? []).map(normalize)],
  }));
}

function scoreTerm(query, term) {
  if (term === query) return 100;
  if (term.startsWith(query)) return 80;
  const words = term.split(' ');
  if (words.some(w => w.startsWith(query))) return 60;
  if (term.includes(query)) return 40;
  if (query.length >= 5 && words.some(w => w.length >= 4 && levenshtein(w, query) <= 1)) return 20;
  return 0;
}

export function scoreFood(query, food) {
  const q = normalize(query);
  if (!q) return 0;
  const terms = [normalize(food.name), ...(food.aliases ?? []).map(normalize)];
  return Math.max(...terms.map(t => scoreTerm(q, t)));
}

// Busqueda con indice precalculado. limit por defecto 20.
export function searchFoods(query, index, { limit = 20 } = {}) {
  const q = normalize(query);
  if (!q) return [];
  const scored = index
    .map(({ food, terms }) => ({ food, score: Math.max(...terms.map(t => scoreTerm(q, t))) }))
    .filter(r => r.score > 0);
  scored.sort((a, b) =>
    b.score - a.score ||
    (b.food.isCustom ? 1 : 0) - (a.food.isCustom ? 1 : 0) ||
    a.food.name.length - b.food.name.length);
  return scored.slice(0, limit).map(r => r.food);
}

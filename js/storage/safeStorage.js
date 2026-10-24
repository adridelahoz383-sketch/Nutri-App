// js/storage/safeStorage.js — wrapper seguro sobre localStorage.
// Nunca lanza por JSON corrupto: getJSON devuelve { ok, value?, raw? }.

export function isAvailable(storage) {
  try {
    const k = '__nt_probe__';
    storage.setItem(k, '1');
    storage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function getRaw(storage, key) {
  try { return storage.getItem(key); } catch { return null; }
}

// { ok: true, value } | { ok: false, reason: 'missing'|'parse', raw }
export function getJSON(storage, key) {
  const raw = getRaw(storage, key);
  if (raw === null || raw === undefined) return { ok: false, reason: 'missing' };
  try {
    return { ok: true, value: JSON.parse(raw), raw };
  } catch {
    return { ok: false, reason: 'parse', raw };
  }
}

export function setJSON(storage, key, value) {
  storage.setItem(key, JSON.stringify(value)); // puede lanzar QuotaExceededError
}

export function remove(storage, key) {
  try { storage.removeItem(key); } catch { /* noop */ }
}

export function keysWithPrefix(storage, prefix) {
  const out = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(prefix)) out.push(k);
    }
  } catch { /* noop */ }
  return out;
}

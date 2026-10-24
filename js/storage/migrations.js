// js/storage/migrations.js — migraciones de esquema puras vN -> vN+1.
// SCHEMA_VERSION actual = 1 (esquema inicial). Anadir migraciones futuras aqui.

import { SCHEMA_VERSION } from '../config.js';

// Cada migracion recibe los datos cargados y devuelve datos en la version siguiente.
const MIGRATIONS = {
  // 0 -> 1: no-op, la v1 es el esquema inicial
  0: data => data,
};

export function migrate(meta, data) {
  let version = meta?.schemaVersion ?? 0;
  let current = data;
  while (version < SCHEMA_VERSION) {
    const fn = MIGRATIONS[version];
    current = fn ? fn(current) : current;
    version += 1;
  }
  return { data: current, schemaVersion: SCHEMA_VERSION };
}

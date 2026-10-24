// js/config.js — constantes numericas del dominio.
// Etiquetas: [EVIDENCIA] literatura | [ESTIMACION] | [DISENIO] decision de producto.
// Ver docs/ESPECIFICACION.md §7-8 y §35.

export const MEALS = ['breakfast', 'lunch', 'dinner', 'snack']; // [DISENIO]

// Factores de actividad (multiplicadores clasicos sobre BMR).
// FAO/WHO/UNU 2004: PAL sostenible 1.40-2.40; 1.2 representa inactividad extrema. [EVIDENCIA+DISENIO]
export const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};
export const ACTIVITY_LEVELS = Object.keys(ACTIVITY_FACTORS);

// Ajuste del objetivo calorico por meta y ritmo. [EVIDENCIA+DISENIO]
// lose: Helms 2014 sugiere ~0.5-1 % peso/sem; gain: Iraki 2019 ~+10-20 %; recomp: mantenimiento.
export const GOALS = ['lose', 'gain', 'recomp', 'maintain'];
export const PACES = ['gentle', 'moderate', 'aggressive'];
export const GOAL_PACES = {
  lose: ['gentle', 'moderate', 'aggressive'],
  gain: ['gentle', 'moderate', 'aggressive'],
  recomp: ['gentle', 'moderate'],
  maintain: ['moderate'],
};
export const GOAL_ADJUSTMENT = {
  lose: { gentle: -0.10, moderate: -0.20, aggressive: -0.25 },
  gain: { gentle: 0.05, moderate: 0.10, aggressive: 0.15 },
  recomp: { gentle: -0.05, moderate: 0 },
  maintain: { moderate: 0 },
};
export const DEFAULT_PACE = { lose: 'moderate', gain: 'moderate', recomp: 'moderate', maintain: 'moderate' };

// Suelo calorico minimo sin supervision medica. [DISENIO basado en umbrales habituales NIH/NHLBI]
export const SEX_FLOOR_KCAL = { male: 1500, female: 1200, unspecified: 1350 };

// Proteina g/kg/dia. [EVIDENCIA] ISSN 2017: 1.4-2.0 g/kg; Iraki 2019: 1.6-2.2 g/kg.
// Valores exactos dentro del rango: [DISENIO]. Sin fuerza: > RDA 0.8 (IOM 2005).
export const PROTEIN_G_PER_KG = { resistanceDeficit: 2.0, resistanceSurplus: 1.8, default: 1.2 };
export const RESISTANCE_MIN_DAYS = 2; // dias/sem para considerar "entrena fuerza" [DISENIO]
export const BMI_HIGH = 30;           // a partir de aqui se usa peso de referencia para proteina
export const BMI_REF = 25;            // peso de referencia = 25 * altura_m^2

// Conversion orientativa kcal -> kg de tejido. [ESTIMACION] Hall 2011: solo para ritmo inicial.
export const KCAL_PER_KG = 7700;

// Peso: tendencia EMA (alpha por dia, inspirada en The Hacker's Diet). [DISENIO]
export const EMA_ALPHA = 0.1;
export const TREND_MIN_ENTRIES = 3;   // para mostrar linea de tendencia
export const TREND_MIN_SPAN_DAYS = 7;
export const RATE_MIN_ENTRIES = 4;    // para valorar ritmo
export const RATE_MIN_SPAN_DAYS = 14;
export const RATE_WINDOW_DAYS = 28;

// Rangos de ritmo esperado (% del peso corporal por semana). [EVIDENCIA+DISENIO]
export const EXPECTED_RATE_PCT = {
  lose: { min: -1.0, max: -0.25 },
  gain: { min: 0.1, max: 0.5 },
  recomp: { min: -0.25, max: 0.25 },
  maintain: { min: -0.25, max: 0.25 },
};

// Rangos de validacion de entradas. [DISENIO]
export const LIMITS = {
  weightKg: { min: 30, max: 300 },
  heightCm: { min: 120, max: 230 },
  age: { min: 18, max: 80 },
  grams: { min: 1, max: 5000 },
  kcalPer100: { min: 0, max: 900 },
  macroPer100: { min: 0, max: 100 },
  name: { min: 1, max: 60 },
  portionGrams: { min: 1, max: 1000 },
};

// Atwater. [EVIDENCIA]
export const ATWATER = { protein: 4, carbs: 4, fat: 9, alcohol: 7 };

// Estado del progreso diario. [DISENIO]
export const PROGRESS = { onTrackLow: 90, onTrackHigh: 105 };

// Recordatorio de peso. [DISENIO]
export const WEIGHT_REMINDER_DAYS = 7;

// Salto de peso sospechoso (posible error de unidad/tecleo). [DISENIO]
export const WEIGHT_JUMP_PCT = 3;
export const WEIGHT_JUMP_DAYS = 7;

// Unidades
export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export const SCHEMA_VERSION = 1;
export const STORAGE_PREFIX = 'nt:';
export const IMPORT_MAX_BYTES = 5 * 1024 * 1024;

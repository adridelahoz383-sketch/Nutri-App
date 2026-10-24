// js/domain/units.js — conversion de unidades. Almacenamiento interno siempre metrico.

import { KG_PER_LB, CM_PER_IN } from '../config.js';

export const kgToLb = kg => kg / KG_PER_LB;
export const lbToKg = lb => lb * KG_PER_LB;
export const cmToFtIn = cm => {
  const totalIn = cm / CM_PER_IN;
  const ft = Math.floor(totalIn / 12);
  return { ft, inch: Math.round((totalIn - ft * 12) * 10) / 10 };
};
export const ftInToCm = (ft, inch = 0) => ft * 12 * CM_PER_IN + inch * CM_PER_IN;

export const round1 = n => Math.round(n * 10) / 10;
export const round = n => Math.round(n);

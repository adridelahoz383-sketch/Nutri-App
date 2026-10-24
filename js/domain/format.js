// js/domain/format.js — formateo para presentacion (es-ES). Redondear SOLO aqui.

const nfInt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf1opt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

export const fmtKcal = n => nfInt.format(Math.round(n));
export const fmtGram = g => (g < 10 ? nf1.format(g) : nfInt.format(Math.round(g)));
export const fmtKg = kg => nf1opt.format(kg);
export const fmtPct = p => `${nfInt.format(Math.round(p))} %`;
export const fmtSigned = (n, decimals = 1) => {
  const abs = Math.abs(n);
  const s = decimals === 0 ? nfInt.format(Math.round(abs)) : nf1.format(abs);
  return `${n < 0 ? '−' : n > 0 ? '+' : ''}${s}`;
};
export const fmtSignedKcal = n => fmtSigned(n, 0);

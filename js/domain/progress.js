// js/domain/progress.js — estado del consumo frente al objetivo. [DISENIO §8.9]

import { PROGRESS } from '../config.js';

export function pctOf(consumed, target) {
  if (!target || target <= 0) return 0;
  return consumed / target * 100;
}

export function dayStatus(consumed, target) {
  const p = pctOf(consumed, target);
  if (p > PROGRESS.onTrackHigh) return 'over';
  if (p >= PROGRESS.onTrackLow) return 'on_track';
  return 'under';
}

// js/core/router.js — router por hash. Rutas:
//   #/hoy  #/hoy/YYYY-MM-DD  #/progreso  #/perfil  #/onboarding/<paso>  #/recuperacion

import { isValidKey, isFutureKey, todayKey } from '../domain/dates.js';

export const ONBOARDING_STEPS = ['bienvenida', 'datos', 'actividad', 'objetivo', 'resultado'];

export function parseHash(hash) {
  const h = (hash || '').replace(/^#\/?/, '');
  const [head, arg] = h.split('/');
  switch (head) {
    case 'hoy': {
      if (arg && isValidKey(arg) && !isFutureKey(arg)) return { name: 'today', date: arg };
      return { name: 'today', date: todayKey() };
    }
    case 'progreso': return { name: 'progress' };
    case 'perfil': return { name: 'profile' };
    case 'onboarding': {
      const step = ONBOARDING_STEPS.includes(arg) ? arg : 'bienvenida';
      return { name: 'onboarding', step };
    }
    case 'recuperacion': return { name: 'recovery' };
    default: return { name: 'today', date: todayKey() };
  }
}

export function routeToHash(route) {
  switch (route.name) {
    case 'today': return `#/hoy/${route.date ?? todayKey()}`;
    case 'progress': return '#/progreso';
    case 'profile': return '#/perfil';
    case 'onboarding': return `#/onboarding/${route.step ?? 'bienvenida'}`;
    case 'recovery': return '#/recuperacion';
    default: return '#/hoy';
  }
}

export function navigate(route) {
  const hash = routeToHash(route);
  if (location.hash === hash) return;
  location.hash = hash;
}

export function startRouter(onRoute) {
  const handler = () => onRoute(parseHash(location.hash));
  window.addEventListener('hashchange', handler);
  handler();
  return () => window.removeEventListener('hashchange', handler);
}

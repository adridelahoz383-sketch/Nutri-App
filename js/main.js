// js/main.js — bootstrap: storage -> migraciones -> store -> router -> render.

import { isAvailable } from './storage/safeStorage.js';
import { createMemoryStorage } from './storage/memoryStorage.js';
import { createRepository } from './storage/repository.js';
import { createStore } from './core/store.js';
import { createActions } from './core/actions.js';
import * as selectors from './core/selectors.js';
import { startRouter, navigate } from './core/router.js';
import { renderNav } from './ui/components/navigation.js';
import { mountOnboarding } from './ui/views/onboardingView.js';
import { mountToday } from './ui/views/todayView.js';
import { mountProgress } from './ui/views/progressView.js';
import { mountProfile } from './ui/views/profileView.js';
import { mountRecovery } from './ui/views/recoveryView.js';
import { toast } from './ui/components/feedback.js';
import { STR } from './i18n/es.js';
import { todayKey, monthKey } from './domain/dates.js';
import { STORAGE_PREFIX } from './config.js';

function boot() {
  const storageOk = isAvailable(localStorage);
  const storage = storageOk ? localStorage : createMemoryStorage();
  const repository = createRepository(storage);

  const { meta, profile, settings, weights, customFoods, corrupt } = repository.loadAll();

  // Respaldar bloques corruptos
  for (const c of corrupt) repository.backupCorrupt(c.key, c.raw);

  // Cargar mes actual + anterior
  const loadedMonths = new Set();
  const days = {};
  const thisMonth = monthKey(todayKey());
  const prevMonth = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return monthKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`); })();
  for (const mk of [thisMonth, prevMonth]) {
    const { days: d, corrupt: c } = repository.loadMonth(mk);
    Object.assign(days, d);
    c.forEach(x => { repository.backupCorrupt(x.key, x.raw); corrupt.push(x); });
    loadedMonths.add(mk);
  }

  const store = createStore({
    meta, profile, settings, weights, customFoods, days, loadedMonths,
    storageAvailable: storageOk,
  });

  const actions = createActions({
    store, repository,
    onError: kind => { if (kind === 'quota') toast(STR.errors.quota); },
  });

  const ctx = { store, actions, selectors, repository, navigate };

  const mainEl = document.getElementById('main');
  const navSlot = document.getElementById('nav-slot');
  const sideSlot = document.getElementById('side-slot');

  let unmountCurrent = null;
  let currentRoute = null;

  function render(route) {
    currentRoute = route;
    const hasProfile = !!store.getState().profile;

    // Guard: sin perfil -> onboarding (salvo recovery)
    if (!hasProfile && route.name !== 'onboarding' && route.name !== 'recovery') {
      navigate({ name: 'onboarding', step: 'bienvenida' });
      return;
    }
    if (corrupt.length && route.name !== 'recovery') {
      navigate({ name: 'recovery' });
      return;
    }

    unmountCurrent?.unmount?.();
    unmountCurrent = null;

    const bare = route.name === 'onboarding' || route.name === 'recovery';
    navSlot.replaceChildren();
    sideSlot.replaceChildren();
    if (!bare) {
      const nav = renderNav(route.name);
      navSlot.append(nav.tabBar);
      sideSlot.append(nav.sidebar);
    }
    document.body.dataset.view = route.name;

    switch (route.name) {
      case 'today': unmountCurrent = mountToday(mainEl, ctx, { date: route.date }); break;
      case 'progress': unmountCurrent = mountProgress(mainEl, ctx); break;
      case 'profile': unmountCurrent = mountProfile(mainEl, ctx); break;
      case 'onboarding': mountOnboarding(mainEl, ctx, { step: route.step }); break;
      case 'recovery': mountRecovery(mainEl, ctx, { corrupt }); break;
      default: navigate({ name: 'today', date: todayKey() });
    }
  }

  startRouter(render);

  // Multi-pestana: recargar claves nt:* cambiadas en otra pestana
  window.addEventListener('storage', e => {
    if (!e.key || !e.key.startsWith(STORAGE_PREFIX)) return;
    const all = repository.loadAll();
    const newDays = { ...store.getState().days };
    for (const mk of store.getState().loadedMonths) {
      Object.assign(newDays, repository.loadMonth(mk).days);
    }
    store.setState(s => ({ ...s, ...all, days: newDays }));
  });

  // Cambio de dia con la app abierta
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentRoute?.name === 'today' && currentRoute.date !== todayKey()) {
      navigate({ name: 'today', date: todayKey() });
    }
  });

  // Atajo teclado "n" -> anadir alimento (desktop)
  document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey
      && currentRoute?.name === 'today'
      && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      import('./ui/components/foodFlow.js').then(m => {
        m.openFoodSearch(ctx, { date: currentRoute.date, meal: m.defaultMealForHour() });
      });
    }
  });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', boot)
  : boot();

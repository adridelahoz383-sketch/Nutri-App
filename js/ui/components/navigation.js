// js/ui/components/navigation.js — tab bar (movil) + sidebar (tablet/desktop).
// CSS muestra uno u otro segun breakpoint.

import { h, icon } from '../dom.js';
import { STR } from '../../i18n/es.js';
import { routeToHash } from '../../core/router.js';
import { todayKey } from '../../domain/dates.js';

const ITEMS = [
  { name: 'today', icon: 'home', label: () => STR.nav.today, hash: () => `#/hoy/${todayKey()}` },
  { name: 'progress', icon: 'chart', label: () => STR.nav.progress, hash: () => '#/progreso' },
  { name: 'profile', icon: 'user', label: () => STR.nav.profile, hash: () => '#/perfil' },
];

function navLink(item, active) {
  const isActive = active === item.name;
  return h('a', {
    class: `nav-item ${isActive ? 'nav-active' : ''}`,
    href: item.hash(),
    'aria-current': isActive ? 'page' : null,
  }, icon(item.icon, 22), h('span', { class: 'nav-label' }, item.label()));
}

export function renderNav(active) {
  const tabBar = h('nav', { class: 'tab-bar', 'aria-label': STR.nav.main },
    ITEMS.map(i => navLink(i, active)));

  const sidebar = h('nav', { class: 'side-nav', 'aria-label': STR.nav.main },
    h('div', { class: 'side-brand' },
      h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, icon('utensils', 22)),
      h('span', { class: 'brand-name' }, STR.app.name)),
    ITEMS.map(i => navLink(i, active)));

  return { tabBar, sidebar };
}

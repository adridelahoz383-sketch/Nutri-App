// js/ui/views/recoveryView.js — datos corruptos: descargar crudo, restablecer bloque o todo.

import { h, clear, icon } from '../dom.js';
import { STR } from '../../i18n/es.js';
import { button } from '../components/forms.js';
import { toast } from '../components/feedback.js';

export function mountRecovery(container, ctx, { corrupt }) {
  const { repository } = ctx;

  const downloadRaw = (key, raw) => {
    const blob = new Blob([String(raw)], { type: 'text/plain' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `nutritrack-corrupt-${key.replace(/[^a-z0-9]/gi, '_')}.txt` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const rows = corrupt.map(({ key, raw }) => h('li', { class: 'recover-row' },
    h('code', { class: 'recover-key' }, key),
    h('span', { class: 'weight-acts' },
      button({ label: STR.recovery.downloadRaw, variant: 'secondary', onClick: () => downloadRaw(key, raw) }),
      button({
        label: STR.recovery.resetBlock, variant: 'danger',
        onClick: () => {
          repository.backupCorrupt(key, raw);
          try { repository.storage.removeItem(key); } catch { /* noop */ }
          toast(STR.recovery.done);
          location.hash = '#/hoy'; location.reload();
        },
      }))));

  clear(container).append(
    h('div', { class: 'onb-wrap' },
      h('div', { class: 'onb-card' },
        h('div', { class: 'recover-icon', 'aria-hidden': 'true' }, icon('alert', 32)),
        h('h1', { class: 'onb-title' }, STR.recovery.title),
        h('p', { class: 'onb-body' }, STR.recovery.body),
        h('h2', { class: 'card-title' }, STR.recovery.affected),
        h('ul', { class: 'recover-list' }, rows),
        button({
          label: STR.recovery.resetAll, variant: 'danger',
          onClick: () => {
            corrupt.forEach(({ key, raw }) => repository.backupCorrupt(key, raw));
            repository.removeAll();
            location.hash = ''; location.reload();
          },
        }))));
}

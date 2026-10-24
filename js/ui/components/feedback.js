// js/ui/components/feedback.js — toast, confirmaciones, banners, estados vacios.

import { h, icon, openDialog, clear } from '../dom.js';
import { button } from './forms.js';

let toastRoot = null;
function getToastRoot() {
  if (!toastRoot) {
    toastRoot = document.getElementById('toast-root')
      ?? document.body.appendChild(h('div', { id: 'toast-root', class: 'toast-root', 'aria-live': 'polite' }));
  }
  return toastRoot;
}

// toast(mensaje, { actionLabel, onAction, duration })
export function toast(msg, { actionLabel, onAction, duration = 6000 } = {}) {
  const el = h('div', { class: 'toast', role: 'status' },
    h('span', { class: 'toast-msg' }, msg),
    actionLabel ? button({ label: actionLabel, variant: 'ghost', onClick: () => { onAction?.(); dismiss(); } }) : null,
    button({ label: null, iconName: 'x', variant: 'ghost', className: 'btn-icon', ariaLabel: 'Cerrar', onClick: () => dismiss() }),
  );
  let timer = setTimeout(dismiss, duration);
  const dismiss = () => { clearTimeout(timer); el.classList.add('toast-out'); setTimeout(() => el.remove(), 200); };
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, 2000); });
  getToastRoot().append(el);
  return { dismiss };
}

// confirmDialog -> Promise<boolean>. requireText: escribir texto para habilitar.
export function confirmDialog({ title, body, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false, requireText = null }) {
  return new Promise(resolve => {
    let done = false;
    const confirmBtn = button({
      label: confirmLabel, variant: danger ? 'danger' : 'primary',
      onClick: () => { done = true; resolve(true); dlg.close(); },
    });
    if (requireText) confirmBtn.disabled = true;
    const bodyEls = [h('p', { class: 'dlg-text' }, body)];
    if (requireText) {
      const input = h('input', { class: 'input', 'aria-label': requireText, autocomplete: 'off' });
      input.addEventListener('input', () => { confirmBtn.disabled = input.value.trim().toUpperCase() !== requireText.toUpperCase(); });
      bodyEls.push(h('p', { class: 'dlg-text' }, requireText), input);
    }
    const content = h('div', { class: 'dlg-card' },
      h('h2', { class: 'dlg-title' }, title),
      ...bodyEls,
      h('div', { class: 'dlg-actions' },
        button({ label: cancelLabel, variant: 'secondary', onClick: () => dlg.close() }),
        confirmBtn),
    );
    const dlg = openDialog(content, {
      onClose: () => { if (!done) resolve(false); },
    });
    // foco inicial en cancelar (seguro para acciones destructivas)
    content.querySelector('.btn-secondary')?.focus();
  });
}

export function banner({ type = 'info', iconName, children }) {
  return h('div', { class: `banner banner-${type}`, role: type === 'warning' ? 'alert' : 'note' },
    icon(iconName ?? (type === 'warning' ? 'alert' : 'info'), 18),
    h('div', { class: 'banner-body' }, children));
}

export function emptyState({ iconName, title, body, ctaLabel, onCta }) {
  return h('div', { class: 'empty' },
    iconName ? h('div', { class: 'empty-icon', 'aria-hidden': 'true' }, icon(iconName, 32)) : null,
    h('p', { class: 'empty-title' }, title),
    body ? h('p', { class: 'empty-body' }, body) : null,
    ctaLabel ? button({ label: ctaLabel, variant: 'secondary', onClick: onCta }) : null);
}

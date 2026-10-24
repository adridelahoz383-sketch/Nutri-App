// js/ui/components/forms.js — controles de formulario.

import { h, icon } from '../dom.js';

export function button({ label, variant = 'primary', iconName, type = 'button', onClick, disabled, className = '', ariaLabel }) {
  const b = h('button', {
    class: `btn btn-${variant} ${className}`, type,
    'aria-label': ariaLabel, disabled,
    on: onClick ? { click: onClick } : undefined,
  });
  if (iconName) b.append(icon(iconName, 18));
  if (label != null) b.append(label);
  return b;
}

export function iconButton({ iconName, ariaLabel, onClick, variant = 'ghost', className = '' }) {
  return button({ label: null, variant, iconName, ariaLabel, onClick, className: `btn-icon ${className}` });
}

let uid = 0;
const nextId = p => `${p}-${++uid}`;

// formField: label + control + ayuda + error accesible.
export function formField({ label, input, help, id }) {
  const fid = id ?? nextId('f');
  const helpId = `${fid}-help`, errId = `${fid}-err`;
  input.id = fid;
  input.setAttribute('aria-describedby', help ? `${helpId} ${errId}` : errId);
  const wrap = h('div', { class: 'field' },
    h('label', { class: 'field-label', for: fid }, label),
    h('div', { class: 'field-control' }, input),
    help ? h('p', { class: 'field-help', id: helpId }, help) : null,
    h('p', { class: 'field-error', id: errId, role: 'alert', hidden: true }),
  );
  return {
    el: wrap, input, errorId: errId,
    setError(msg) {
      const err = wrap.querySelector('.field-error');
      if (msg) {
        err.textContent = msg;
        err.hidden = false;
        input.setAttribute('aria-invalid', 'true');
      } else {
        err.textContent = '';
        err.hidden = true;
        input.removeAttribute('aria-invalid');
      }
    },
  };
}

export function numberInput({ value, suffix, placeholder, inputmode = 'decimal', min, max, onInput, onBlur, autofocus }) {
  const wrap = h('div', { class: 'input-suffix' });
  const input = h('input', {
    class: 'input', type: 'text', inputmode, placeholder,
    value: value ?? '', 'aria-label': suffix ? undefined : placeholder,
  });
  if (min != null) input.min = min;
  if (max != null) input.max = max;
  if (onInput) input.addEventListener('input', e => onInput(e.target.value));
  if (onBlur) input.addEventListener('blur', () => onBlur(input.value));
  if (autofocus) setTimeout(() => input.focus(), 0);
  wrap.append(input);
  if (suffix) wrap.append(h('span', { class: 'input-unit', 'aria-hidden': 'true' }, suffix));
  return input.parentElement ? Object.assign(input, { wrap }) : input;
}

// Selector segmentado accesible (radios nativos estilizados).
export function segmented({ name, options, value, onChange, ariaLabel }) {
  const group = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': ariaLabel });
  for (const opt of options) {
    const id = nextId('seg');
    const radio = h('input', {
      type: 'radio', name, id, value: opt.value, class: 'seg-radio',
    });
    if (opt.value === value) radio.checked = true;
    radio.addEventListener('change', () => onChange?.(opt.value));
    group.append(radio, h('label', { class: 'seg-label', for: id }, opt.label));
  }
  return group;
}

// Tarjeta de opcion (radio nativo + titulo + descripcion).
export function optionCard({ name, value, title, desc, iconName, checked, onChange }) {
  const id = nextId('opt');
  const radio = h('input', { type: 'radio', name, id, value, class: 'optcard-radio' });
  if (checked) radio.checked = true;
  const card = h('label', { class: 'optcard', for: id },
    radio,
    iconName ? icon(iconName, 22) : null,
    h('span', { class: 'optcard-body' },
      h('span', { class: 'optcard-title' }, title),
      desc ? h('span', { class: 'optcard-desc' }, desc) : null),
    h('span', { class: 'optcard-check', 'aria-hidden': 'true' }, icon('check', 16)),
  );
  radio.addEventListener('change', () => onChange?.(value));
  return card;
}

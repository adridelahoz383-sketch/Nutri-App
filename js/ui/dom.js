// js/ui/dom.js — helpers de DOM seguros. NUNCA innerHTML con datos variables.

const SVG_NS = 'http://www.w3.org/2000/svg';

// h(tag, attrs?, ...children)
// attrs: class, dataset:{}, on:{event:fn}, atributos aria-*, htmlFor->for, value, checked, disabled, role...
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
      else if (k === 'style' && typeof v === 'object') for (const [p, val] of Object.entries(v)) el.style.setProperty(p, val);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

export function icon(name, size = 20) {
  const svg = svgEl('svg', { width: size, height: size, 'aria-hidden': 'true', class: 'icon' });
  svg.append(svgEl('use', { href: `assets/icons.svg#i-${name}` }));
  return svg;
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

// Delegacion de eventos
export function on(container, event, selector, fn) {
  container.addEventListener(event, e => {
    const t = e.target.closest(selector);
    if (t && container.contains(t)) fn(e, t);
  });
}

// Dialogo modal nativo. openDialog(el, { onClose }) -> { close }
export function openDialog(contentEl, { onClose, className = '' } = {}) {
  const dlg = h('dialog', { class: `dlg ${className}` });
  dlg.append(contentEl);
  document.body.append(dlg);
  const close = () => { if (dlg.open) dlg.close(); };
  dlg.addEventListener('close', () => { dlg.remove(); onClose?.(); });
  // clic fuera del contenido (en el backdrop)
  dlg.addEventListener('click', e => {
    const r = dlg.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (e.target === dlg && !inside) close();
  });
  dlg.showModal();
  return { el: dlg, close };
}

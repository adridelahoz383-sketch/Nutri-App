// js/ui/views/profileView.js — perfil, unidades, alimentos personalizados, privacidad y datos.

import { h, clear, icon } from '../dom.js';
import { STR, errMsg } from '../../i18n/es.js';
import { ACTIVITY_LEVELS, GOALS, GOAL_PACES, DEFAULT_PACE } from '../../config.js';
import { validateBirthYear, validateHeightCm } from '../../domain/validation.js';
import { nowIso, todayKey } from '../../domain/dates.js';
import { button, iconButton, segmented, formField, optionCard } from '../components/forms.js';
import { toast, confirmDialog, banner } from '../components/feedback.js';
import { openCustomFoodForm } from '../components/foodFlow.js';
import { openWeightDialog } from './progressView.js';

function section(id, title, ...children) {
  return h('section', { class: 'card profile-section', 'aria-labelledby': id },
    h('h2', { class: 'card-title', id }, title), ...children);
}

export function mountProfile(container, ctx) {
  const { store, actions, selectors } = ctx;

  const render = () => {
    const state = store.getState();
    const p = state.profile;
    if (!p) { clear(container).append(h('p', null, STR.common.loading)); return; }
    const targets = selectors.selectTargets(state);

    // --- Editar perfil (inline) ---
    const yearIn = h('input', { class: 'input', type: 'text', inputmode: 'numeric', value: String(p.birthYear), maxlength: '4' });
    const cmIn = h('input', { class: 'input', type: 'text', inputmode: 'decimal', value: String(p.heightCm) });
    const aliasIn = h('input', { class: 'input', type: 'text', value: p.alias ?? '', maxlength: '40' });
    let sex = p.sex, act = p.activityLevel, goal = p.goal, pace = p.pace, res = p.resistanceDaysPerWeek;
    const errEl = h('p', { class: 'field-error', role: 'alert', hidden: true });

    const resSel = h('select', { class: 'input select' },
      h('option', { value: '' }, 'Prefiero no indicarlo'),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map(d => h('option', { value: String(d), selected: res === d ? true : null }, String(d))));
    resSel.addEventListener('change', () => { res = resSel.value === '' ? null : Number(resSel.value); });

    const paceWrap = h('div', { class: 'field' });
    const renderPace = () => {
      clear(paceWrap);
      const paces = GOAL_PACES[goal] ?? ['moderate'];
      if (!paces.includes(pace)) pace = DEFAULT_PACE[goal];
      paceWrap.append(h('span', { class: 'field-label' }, STR.onboarding.paceLabel),
        segmented({
          name: 'pf-pace', ariaLabel: STR.onboarding.paceLabel, value: pace,
          options: paces.map(x => ({ value: x, label: STR.paces[x] })),
          onChange: v => { pace = v; },
        }));
    };
    renderPace();

    const profileForm = h('div', { class: 'profile-form' },
      formField({ label: STR.onboarding.aliasLabel, input: aliasIn }).el,
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, STR.onboarding.sexLabel),
        segmented({
          name: 'pf-sex', ariaLabel: STR.onboarding.sexLabel, value: sex,
          options: [
            { value: 'male', label: STR.onboarding.sexMale },
            { value: 'female', label: STR.onboarding.sexFemale },
            { value: 'unspecified', label: STR.onboarding.sexUnspecified },
          ],
          onChange: v => { sex = v; },
        })),
      h('div', { class: 'form-row' },
        formField({ label: STR.onboarding.birthYearLabel, input: yearIn }).el,
        formField({ label: STR.onboarding.heightLabel, input: cmIn }).el),
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, STR.onboarding.activityTitle),
        segmented({
          name: 'pf-act', ariaLabel: STR.onboarding.activityTitle, value: act,
          options: ACTIVITY_LEVELS.map(k => ({ value: k, label: STR.activity[k] })),
          onChange: v => { act = v; },
        })),
      formField({ label: STR.activity.resistance, input: resSel }).el,
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, STR.onboarding.goalTitle),
        segmented({
          name: 'pf-goal', ariaLabel: STR.onboarding.goalTitle, value: goal,
          options: GOALS.map(g => ({ value: g, label: STR.goals[g] })),
          onChange: v => { goal = v; renderPace(); },
        })),
      paceWrap,
      errEl,
      targets ? h('p', { class: 'field-help' },
        `${STR.onboarding.target}: ${Math.round(targets.kcal)} kcal · ${STR.onboarding.proteinTarget}: ≈${Math.round(targets.proteinGrams)} g`) : null,
      button({
        label: STR.profile.save, variant: 'primary',
        onClick: () => {
          const yv = validateBirthYear(yearIn.value);
          const hv = validateHeightCm(cmIn.value);
          if (!yv.ok || !hv.ok) {
            errEl.textContent = errMsg((!yv.ok ? yv : hv).error); errEl.hidden = false; return;
          }
          errEl.hidden = true;
          actions.saveProfile({
            alias: aliasIn.value.trim() || null, sex, birthYear: yv.value, heightCm: hv.value,
            activityLevel: act, resistanceDaysPerWeek: res, goal, pace,
            disclaimerAcceptedAt: p.disclaimerAcceptedAt ?? nowIso(),
          });
          toast(STR.profile.saved);
        },
      }));

    // --- Unidades ---
    const units = h('div', { class: 'form-row-2' },
      h('div', null, h('span', { class: 'field-label' }, STR.onboarding.unitsWeight),
        segmented({
          name: 'set-wu', ariaLabel: STR.onboarding.unitsWeight, value: state.settings.weightUnit,
          options: [{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }],
          onChange: v => actions.updateSettings({ weightUnit: v }),
        })),
      h('div', null, h('span', { class: 'field-label' }, STR.onboarding.unitsHeight),
        segmented({
          name: 'set-hu', ariaLabel: STR.onboarding.unitsHeight, value: state.settings.heightUnit,
          options: [{ value: 'cm', label: 'cm' }, { value: 'ftin', label: 'ft/in' }],
          onChange: v => actions.updateSettings({ heightUnit: v }),
        })));

    // --- Alimentos personalizados ---
    const customList = h('ul', { class: 'custom-list' },
      state.customFoods.length === 0
        ? h('li', { class: 'empty-body' }, STR.profile.noCustom)
        : state.customFoods.map(f => h('li', { class: 'custom-row' },
            h('span', { class: 'custom-name' }, f.name),
            h('span', { class: 'custom-meta' }, `${f.per100.kcal} kcal/100 ${f.unit}`),
            h('span', { class: 'weight-acts' },
              iconButton({ iconName: 'edit', ariaLabel: STR.common.edit, onClick: () => openCustomFoodForm(ctx, { food: f }) }),
              iconButton({
                iconName: 'trash', ariaLabel: STR.common.delete,
                onClick: async () => {
                  const ok = await confirmDialog({ title: STR.custom.deleteTitle, body: STR.custom.deleteBody, danger: true, confirmLabel: STR.common.delete });
                  if (ok) { actions.removeCustomFood(f.id); toast(STR.custom.removed); }
                },
              })))));
    const customSec = h('div', null, customList,
      button({ label: STR.profile.newCustom, variant: 'secondary', iconName: 'plus', onClick: () => openCustomFoodForm(ctx, {}) }));

    // --- Datos: export/import/wipe ---
    const fileInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'visually-hidden' });
    fileInput.addEventListener('change', async () => {
      const f = fileInput.files?.[0];
      if (!f) return;
      const text = await f.text();
      const ok = await confirmDialog({ title: STR.profile.import, body: STR.profile.importConfirm });
      if (!ok) { fileInput.value = ''; return; }
      try {
        actions.importData(text);
        toast(STR.profile.importOk);
      } catch {
        toast(STR.profile.importError);
      }
      fileInput.value = '';
    });

    const dataMgmt = h('div', { class: 'data-actions' },
      button({
        label: STR.profile.export, variant: 'secondary', iconName: 'download',
        onClick: () => {
          const blob = new Blob([actions.exportData()], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: `nutritrack-${todayKey()}.json` });
          document.body.append(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        },
      }),
      button({ label: STR.profile.import, variant: 'secondary', iconName: 'upload', onClick: () => fileInput.click() }),
      fileInput,
      button({
        label: STR.profile.wipe, variant: 'danger', iconName: 'trash',
        onClick: async () => {
          const ok = await confirmDialog({
            title: STR.profile.wipeTitle, body: STR.profile.wipeBody,
            confirmLabel: STR.profile.wipe, danger: true, requireText: 'BORRAR',
          });
          if (ok) { actions.wipeAllData(); location.hash = ''; location.reload(); }
        },
      }));

    clear(container).append(
      h('h1', { class: 'view-title' }, STR.profile.title),
      section('pf-data', STR.profile.sectionData, profileForm),
      section('pf-units', STR.profile.sectionUnits, units),
      section('pf-custom', STR.profile.sectionCustom, customSec),
      section('pf-privacy', STR.profile.sectionPrivacy,
        h('p', { class: 'privacy-text' }, STR.profile.privacyBody)),
      section('pf-mgmt', STR.profile.sectionDataMgmt, dataMgmt),
      section('pf-legal', STR.profile.disclaimerTitle,
        h('p', { class: 'privacy-text' }, STR.onboarding.disclaimer)));
  };

  const unsub = store.subscribe(render);
  render();
  return { unmount: () => unsub() };
}

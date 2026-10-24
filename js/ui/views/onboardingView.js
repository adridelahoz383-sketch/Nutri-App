// js/ui/views/onboardingView.js — 5 pasos: bienvenida, datos, actividad, objetivo, resultado.

import { h, icon, clear } from '../dom.js';
import { STR } from '../../i18n/es.js';
import { ACTIVITY_LEVELS, GOALS, GOAL_PACES, DEFAULT_PACE, LIMITS } from '../../config.js';
import { validateBirthYear, validateHeightCm, validateWeightKg, validateName } from '../../domain/validation.js';
import { calcTargets, calcBMI } from '../../domain/nutrition.js';
import { lbToKg, ftInToCm, kgToLb, cmToFtIn } from '../../domain/units.js';
import { fmtKcal, fmtGram, fmtSigned } from '../../domain/format.js';
import { todayKey, nowIso } from '../../domain/dates.js';
import { button, formField, segmented, optionCard } from '../components/forms.js';
import { banner } from '../components/feedback.js';
import { ONBOARDING_STEPS } from '../../core/router.js';

// Borrador del onboarding (sobrevive entre pasos).
const draft = {
  alias: '', sex: null, birthYear: '', heightCm: '', heightFt: '', heightIn: '',
  weightKg: '', weightLb: '', weightUnit: 'kg', heightUnit: 'cm',
  activityLevel: null, resistanceDaysPerWeek: null, goal: null, pace: 'moderate',
};

function stepShell(step, title, children) {
  const i = ONBOARDING_STEPS.indexOf(step);
  return h('div', { class: 'onb-wrap' },
    h('div', { class: 'onb-card' },
      h('p', { class: 'onb-step' }, STR.onboarding.step(Math.min(i, 4))),
      h('div', { class: 'onb-progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 4, 'aria-valuenow': i },
        h('div', { class: 'onb-progress-fill', style: { width: `${i / 4 * 100}%` } })),
      h('h1', { class: 'onb-title' }, title),
      ...children));
}

function navRow({ onBack, onNext, nextLabel, nextDisabled }) {
  return h('div', { class: 'onb-nav' },
    onBack ? button({ label: STR.onboarding.back, variant: 'secondary', onClick: onBack }) : h('span'),
    button({ label: nextLabel ?? STR.onboarding.next, variant: 'primary', onClick: onNext, disabled: nextDisabled }));
}

export function mountOnboarding(container, ctx, { step }) {
  const { navigate } = ctx;
  const go = s => navigate({ name: 'onboarding', step: s });
  let el;

  if (step === 'bienvenida') {
    let accepted = false;
    const chk = h('input', { type: 'checkbox', id: 'ob-accept' });
    const nextBtn = button({ label: STR.onboarding.next, variant: 'primary', disabled: true, onClick: () => go('datos') });
    chk.addEventListener('change', () => { accepted = chk.checked; nextBtn.disabled = !accepted; });
    el = stepShell(step, STR.onboarding.welcomeTitle, [
      h('p', { class: 'onb-body' }, STR.onboarding.welcomeBody),
      h('div', { class: 'onb-notice' },
        h('h2', { class: 'onb-notice-title' }, STR.onboarding.disclaimerTitle),
        h('p', null, STR.onboarding.disclaimer),
        h('p', { class: 'onb-privacy' }, STR.onboarding.privacy)),
      h('label', { class: 'check-line', for: 'ob-accept' }, chk, h('span', null, STR.onboarding.accept)),
      h('div', { class: 'onb-nav' }, h('span'), nextBtn),
    ]);
  }

  else if (step === 'datos') {
    const aliasIn = h('input', { class: 'input', type: 'text', value: draft.alias, maxlength: '40', autocomplete: 'nickname' });
    const yearIn = h('input', { class: 'input', type: 'text', inputmode: 'numeric', value: draft.birthYear, maxlength: '4', placeholder: '1995' });
    const cmIn = h('input', { class: 'input', type: 'text', inputmode: 'decimal', value: draft.heightCm });
    const ftIn = h('input', { class: 'input', type: 'text', inputmode: 'numeric', value: draft.heightFt, 'aria-label': STR.common.ft });
    const inIn = h('input', { class: 'input', type: 'text', inputmode: 'decimal', value: draft.heightIn, 'aria-label': STR.common.in });
    const kgIn = h('input', { class: 'input', type: 'text', inputmode: 'decimal', value: draft.weightKg });
    const lbIn = h('input', { class: 'input', type: 'text', inputmode: 'decimal', value: draft.weightLb });

    const fAlias = formField({ label: STR.onboarding.aliasLabel, input: aliasIn });
    const fYear = formField({ label: STR.onboarding.birthYearLabel, input: yearIn, help: STR.onboarding.birthYearHint });
    const fCm = formField({ label: STR.onboarding.heightLabel, input: cmIn });
    const fFt = formField({ label: `${STR.onboarding.heightLabel} (${STR.common.ft} / ${STR.common.in})`, input: h('div', { class: 'form-row' }, ftIn, inIn) });
    const fKg = formField({ label: STR.onboarding.weightLabel, input: kgIn });
    const fLb = formField({ label: `${STR.onboarding.weightLabel} (${STR.common.lb})`, input: lbIn });
    fFt.el.hidden = draft.heightUnit !== 'ftin';
    fCm.el.hidden = draft.heightUnit === 'ftin';
    fLb.el.hidden = draft.weightUnit !== 'lb';
    fKg.el.hidden = draft.weightUnit === 'lb';

    let sex = draft.sex;
    const sexSeg = segmented({
      name: 'ob-sex', ariaLabel: STR.onboarding.sexLabel, value: sex,
      options: [
        { value: 'male', label: STR.onboarding.sexMale },
        { value: 'female', label: STR.onboarding.sexFemale },
        { value: 'unspecified', label: STR.onboarding.sexUnspecified },
      ],
      onChange: v => { sex = v; validate(); },
    });

    const hUnitSeg = segmented({
      name: 'ob-hunit', ariaLabel: STR.onboarding.unitsHeight, value: draft.heightUnit,
      options: [{ value: 'cm', label: 'cm' }, { value: 'ftin', label: 'ft/in' }],
      onChange: v => { draft.heightUnit = v; fFt.el.hidden = v !== 'ftin'; fCm.el.hidden = v === 'ftin'; validate(); },
    });
    const wUnitSeg = segmented({
      name: 'ob-wunit', ariaLabel: STR.onboarding.unitsWeight, value: draft.weightUnit,
      options: [{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }],
      onChange: v => { draft.weightUnit = v; fLb.el.hidden = v !== 'lb'; fKg.el.hidden = v === 'lb'; validate(); },
    });

    const nextBtn = button({ label: STR.onboarding.next, variant: 'primary', onClick: () => {
      if (!validate(true)) return;
      draft.alias = aliasIn.value.trim(); draft.sex = sex;
      draft.birthYear = yearIn.value.trim();
      draft.heightCm = draft.heightUnit === 'ftin' ? String(ftInToCm(Number(ftIn.value) || 0, Number(inIn.value.replace(',', '.')) || 0)) : cmIn.value.trim();
      draft.weightKg = draft.weightUnit === 'lb' ? String(lbToKg(Number(lbIn.value.replace(',', '.')) || 0)) : kgIn.value.trim();
      go('actividad');
    }});

    function validate(showErrors = false) {
      const yv = validateBirthYear(yearIn.value);
      const hv = draft.heightUnit === 'ftin'
        ? (() => { const cm = ftInToCm(Number(ftIn.value) || 0, Number(inIn.value.replace(',', '.')) || 0); return cm >= LIMITS.heightCm.min && cm <= LIMITS.heightCm.max ? { ok: true } : { ok: false, error: 'height_range' }; })()
        : validateHeightCm(cmIn.value);
      const wv = draft.weightUnit === 'lb'
        ? (() => { const kg = lbToKg(Number(lbIn.value.replace(',', '.')) || NaN); return Number.isFinite(kg) && kg >= LIMITS.weightKg.min && kg <= LIMITS.weightKg.max ? { ok: true } : { ok: false, error: 'weight_range' }; })()
        : validateWeightKg(kgIn.value);
      const allOk = !!sex && yv.ok && hv.ok && wv.ok;
      if (showErrors) {
        fYear.setError(yv.ok ? null : STR.errors[yv.error]);
        (draft.heightUnit === 'ftin' ? fFt : fCm).setError(hv.ok ? null : STR.errors[hv.error]);
        (draft.weightUnit === 'lb' ? fLb : fKg).setError(wv.ok ? null : STR.errors[wv.error]);
        if (!allOk) (el.querySelector('.input[aria-invalid="true"]') ?? el.querySelector('.input'))?.focus();
      }
      return allOk;
    }

    el = stepShell(step, STR.onboarding.corporalTitle, [
      fAlias.el,
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, STR.onboarding.sexLabel), sexSeg,
        h('p', { class: 'field-help' }, STR.onboarding.sexHint)),
      fYear.el,
      h('div', { class: 'form-row-2' },
        h('div', null, h('span', { class: 'field-label' }, STR.onboarding.unitsHeight), hUnitSeg),
        h('div', null, h('span', { class: 'field-label' }, STR.onboarding.unitsWeight), wUnitSeg)),
      fCm.el, fFt.el, fKg.el, fLb.el,
      navRow({ onBack: () => go('bienvenida'), onNext: () => nextBtn.click() }),
    ]);
  }

  else if (step === 'actividad') {
    let level = draft.activityLevel;
    let res = draft.resistanceDaysPerWeek;
    const nextBtn = button({ label: STR.onboarding.next, variant: 'primary', disabled: !level, onClick: () => { draft.activityLevel = level; draft.resistanceDaysPerWeek = res; go('objetivo'); } });
    const cards = h('div', { class: 'optcard-list', role: 'radiogroup', 'aria-label': STR.onboarding.activityTitle },
      ACTIVITY_LEVELS.map(k => optionCard({
        name: 'ob-act', value: k, title: STR.activity[k], desc: STR.activity[`${k}Desc`],
        iconName: k === 'sedentary' ? 'user' : k === 'very_active' ? 'trending-up' : 'scale',
        checked: level === k,
        onChange: v => { level = v; nextBtn.disabled = false; },
      })));
    const resSel = h('select', { class: 'input select' },
      h('option', { value: '' }, 'Prefiero no indicarlo'),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map(d => h('option', { value: String(d), selected: res === d ? true : null }, String(d))));
    resSel.addEventListener('change', () => { res = resSel.value === '' ? null : Number(resSel.value); });
    el = stepShell(step, STR.onboarding.activityTitle, [
      cards,
      h('p', { class: 'field-help' }, STR.activity.hint),
      formField({ label: STR.activity.resistance, input: resSel, help: STR.activity.resistanceHint }).el,
      h('div', { class: 'onb-nav' },
        button({ label: STR.onboarding.back, variant: 'secondary', onClick: () => go('datos') }), nextBtn),
    ]);
  }

  else if (step === 'objetivo') {
    let goal = draft.goal;
    let pace = draft.pace;
    const warnEl = h('div', { class: 'onb-warn' });
    const paceWrap = h('div', { class: 'field' }, h('span', { class: 'field-label' }, STR.onboarding.paceLabel));
    const nextBtn = button({ label: STR.onboarding.calculate, variant: 'primary', disabled: !goal, onClick: () => { draft.goal = goal; draft.pace = pace; go('resultado'); } });

    function renderPace() {
      clear(paceWrap);
      paceWrap.append(h('span', { class: 'field-label' }, STR.onboarding.paceLabel));
      const paces = GOAL_PACES[goal] ?? ['moderate'];
      if (!paces.includes(pace)) pace = DEFAULT_PACE[goal] ?? 'moderate';
      paceWrap.append(segmented({
        name: 'ob-pace', ariaLabel: STR.onboarding.paceLabel, value: pace,
        options: paces.map(p => ({ value: p, label: STR.paces[p] })),
        onChange: v => { pace = v; },
      }));
      clear(warnEl);
      const bmi = calcBMI(Number(draft.weightKg), Number(draft.heightCm));
      if (goal === 'recomp' && !(draft.resistanceDaysPerWeek >= 2))
        warnEl.append(banner({ type: 'info', children: [STR.onboarding.recompWarning] }));
      if (goal === 'lose' && bmi < 18.5)
        warnEl.append(banner({ type: 'warning', children: [STR.onboarding.underweightWarning] }));
    }

    const cards = h('div', { class: 'optcard-list', role: 'radiogroup', 'aria-label': STR.onboarding.goalTitle },
      GOALS.map(g => optionCard({
        name: 'ob-goal', value: g, title: STR.goals[g], desc: STR.goals[`${g}Desc`],
        checked: goal === g,
        onChange: v => { goal = v; nextBtn.disabled = false; renderPace(); },
      })));

    el = stepShell(step, STR.onboarding.goalTitle, [
      cards, paceWrap, warnEl,
      h('div', { class: 'onb-nav' },
        button({ label: STR.onboarding.back, variant: 'secondary', onClick: () => go('actividad') }), nextBtn),
    ]);
    if (goal) renderPace();
  }

  else if (step === 'resultado') {
    const weightKg = Number(draft.weightKg);
    const profile = {
      alias: draft.alias || null, sex: draft.sex ?? 'unspecified',
      birthYear: Number(draft.birthYear), heightCm: Number(draft.heightCm),
      activityLevel: draft.activityLevel ?? 'sedentary',
      resistanceDaysPerWeek: draft.resistanceDaysPerWeek,
      goal: draft.goal ?? 'maintain', pace: draft.pace ?? 'moderate',
      disclaimerAcceptedAt: nowIso(),
    };
    const t = calcTargets(profile, weightKg);
    const adjPct = Math.round(t.adjustment * 100);
    const rows = [
      [STR.onboarding.bmr, `${fmtKcal(t.bmr)} kcal`],
      [STR.onboarding.tdee, `${fmtKcal(t.tdee)} kcal`],
      [STR.onboarding.adjustment, `${fmtSigned(adjPct, 0)} %`],
      [STR.onboarding.proteinTarget, `≈ ${fmtGram(t.proteinGrams)} g`],
      [STR.onboarding.expectedRate, `${fmtSigned(t.weeklyKg)} kg ${STR.onboarding.approxWeek}`],
    ];
    el = stepShell(step, STR.onboarding.resultTitle, [
      t.floorApplied ? banner({ type: 'warning', children: [STR.onboarding.floorWarning] }) : null,
      h('div', { class: 'result-hero' },
        h('span', { class: 'result-num' }, fmtKcal(t.kcal)),
        h('span', { class: 'result-unit' }, `kcal/${STR.nav.today.toLowerCase()} · estimado`)),
      h('dl', { class: 'result-list' },
        rows.flatMap(([k, v]) => [h('dt', null, k), h('dd', null, v)])),
      h('details', { class: 'how' },
        h('summary', null, STR.onboarding.howCalculated),
        h('p', null, STR.onboarding.howBody1),
        h('p', null, STR.onboarding.howBody2)),
      h('div', { class: 'onb-nav' },
        button({ label: STR.onboarding.back, variant: 'secondary', onClick: () => go('objetivo') }),
        button({
          label: STR.onboarding.finish, variant: 'primary',
          onClick: () => {
            ctx.actions.saveProfile(profile);
            ctx.actions.upsertWeight(todayKey(), weightKg);
            ctx.actions.updateSettings({ weightUnit: draft.weightUnit, heightUnit: draft.heightUnit });
            navigate({ name: 'today', date: todayKey() });
          },
        })),
    ]);
  }

  else {
    el = stepShell('bienvenida', STR.onboarding.welcomeTitle, [h('p', null, STR.common.loading)]);
  }

  clear(container).append(el);
}

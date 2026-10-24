import type { TFunction } from 'i18next';

import { ageParts, formatDate, formatNumber, parseISODate, today } from './dates';
import { isDueDateItem } from './schedule';
import type { PetData } from '@/hooks/usePetData';
import { breedRisks } from '@/constants/breeds';

/** The facts a vet needs first, in priority order. */
export function summarize(d: PetData) {
  const activeConditions = d.conditions.filter((c) => c.status !== 'resolved');
  const pastConditions = d.conditions.filter((c) => c.status === 'resolved');
  const isEnded = (end: string | null) => {
    const e = parseISODate(end);
    return !!e && e < today();
  };
  const currentMeds = d.medicines.filter((m) => m.active && !isDueDateItem(m) && !isEnded(m.end_date));
  const vaccines = d.medicines.filter(
    (m) => m.kind === 'vaccine' || m.kind === 'deworming' || m.kind === 'flea_tick',
  );
  const recentVisits = [...d.visits].sort((a, b) => b.visit_date.localeCompare(a.visit_date)).slice(0, 5);
  return { activeConditions, pastConditions, currentMeds, vaccines, recentVisits };
}

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Printable one-page HTML used for the PDF on every platform. */
export function summaryHtml(d: PetData, t: TFunction, lang: string, ownerName?: string | null) {
  const s = summarize(d);
  const p = d.pet;
  const age = ageParts(p.birth_date);
  const ageText = age
    ? `${age.years ? t('pet.years', { count: age.years }) : ''} ${age.months ? t('pet.months', { count: age.months }) : ''}`.trim()
    : t('common.unknown');
  const date = (x: string | null) => (x ? formatDate(x, lang) : '');
  const none = `<p class="none">${esc(t('summary.none'))}</p>`;
  const risks = breedRisks(p.species, p.breed);
  const font =
    lang === 'bn'
      ? "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
      : "'Poppins', 'Helvetica Neue', Arial, sans-serif";

  const rows = (items: string[][]) =>
    `<table>${items
      .filter((r) => r[1])
      .map((r) => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`)
      .join('')}</table>`;

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.name)} – ${esc(t('summary.title'))}</title>
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: ${font}; color: #2B2422; font-size: 12px; line-height: 1.5; margin: 0; padding: 24px; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #E8705F; padding-bottom: 10px; margin-bottom: 14px; }
  h1 { font-size: 24px; margin: 0; }
  .sub { color: #8C807B; }
  h2 { font-size: 14px; color: #C9533F; margin: 18px 0 6px; text-transform: uppercase; letter-spacing: .04em; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; width: 34%; color: #8C807B; font-weight: 400; padding: 3px 0; vertical-align: top; }
  td { padding: 3px 0; }
  .alert { background: #FDE4E1; border-left: 4px solid #D6453D; padding: 8px 12px; border-radius: 6px; }
  .alert strong { color: #D6453D; }
  ul { margin: 0; padding-left: 18px; }
  li { margin: 2px 0; }
  .muted { color: #8C807B; }
  .none { color: #8C807B; margin: 0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
  footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #F1E3DC; color: #8C807B; font-size: 10px; }
</style></head><body>
<header>
  <div><h1>${esc(p.name)}</h1><div class="sub">${esc([t(`species.${p.species}`), p.breed, p.breed_mix].filter(Boolean).join(' · '))}</div></div>
  <div class="sub">${esc(t('summary.title'))}<br>${esc(formatDate(new Date(), lang))}</div>
</header>

<div class="alert"><strong>${esc(t('pet.allergies'))}:</strong> ${
    d.allergies.length
      ? d.allergies.map((a) => `${esc(a.allergen)}${a.reaction ? ` (${esc(a.reaction)})` : ''}`).join('; ')
      : esc(t('pet.noAllergies'))
  }</div>

<div class="grid">
<div>
<h2>${esc(t('summary.identity'))}</h2>
${rows([
  [t('pet.age'), `${ageText}${p.birth_date_estimated ? ` (${t('common.estimated')})` : ''}`],
  [t('pet.sex'), t(`sex.${p.sex}`)],
  [t('pet.weight'), p.weight_kg != null ? t('pet.kg', { value: formatNumber(p.weight_kg, lang) }) : ''],
  [t('petForm.neutered'), p.neutered == null ? '' : p.neutered ? t('common.yes') : t('common.no')],
  [t('petForm.microchip'), p.microchip ?? ''],
  [t('petForm.marks'), p.distinguishing_marks ?? ''],
  [
    t('petForm.origin'),
    d.origin
      ? [t(`originSource.${d.origin.source}`), d.origin.found_location].filter(Boolean).join(', ')
      : '',
  ],
  [t('summary.owner'), ownerName ?? ''],
])}
</div>
<div>
<h2>${esc(t('pet.activeConditions'))}</h2>
${
  s.activeConditions.length
    ? `<ul>${s.activeConditions
        .map(
          (c) =>
            `<li><strong>${esc(c.name)}</strong> – ${esc(t(`conditionStatus.${c.status}`))}${c.diagnosed_on ? `, ${esc(date(c.diagnosed_on))}` : ''}${c.treatment ? `<br><span class="muted">${esc(c.treatment)}</span>` : ''}</li>`,
        )
        .join('')}</ul>`
    : none
}
<h2>${esc(t('pet.currentMeds'))}</h2>
${
  s.currentMeds.length
    ? `<ul>${s.currentMeds
        .map(
          (m) =>
            `<li><strong>${esc(m.name)}</strong>${m.dose ? ` – ${esc(m.dose)}` : ''}, ${esc(t(`frequency.${m.frequency}`))}${m.end_date ? ` → ${esc(date(m.end_date))}` : ''}</li>`,
        )
        .join('')}</ul>`
    : none
}
</div>
</div>

<h2>${esc(t('summary.vaccines'))}</h2>
${
  s.vaccines.length
    ? `<table>${s.vaccines
        .map(
          (m) =>
            `<tr><th>${esc(m.name)}</th><td>${m.next_due ? esc(t('medicine.due', { date: date(m.next_due) })) : esc(t('medicine.ended'))}</td></tr>`,
        )
        .join('')}</table>`
    : none
}

<h2>${esc(t('summary.recentVisits'))}</h2>
${
  s.recentVisits.length
    ? `<table>${s.recentVisits
        .map(
          (v) =>
            `<tr><th>${esc(date(v.visit_date))}<br><span class="muted">${esc([v.vet_name, v.clinic].filter(Boolean).join(', '))}</span></th><td><strong>${esc(v.reason ?? '')}</strong>${v.diagnosis ? `<br>${esc(v.diagnosis)}` : ''}</td></tr>`,
        )
        .join('')}</table>`
    : none
}

${
  s.pastConditions.length
    ? `<h2>${esc(t('summary.pastConditions'))}</h2><ul>${s.pastConditions
        .map(
          (c) =>
            `<li>${esc(c.name)}${c.diagnosed_on ? ` (${esc(date(c.diagnosed_on))})` : ''}${c.pre_adoption ? ` – ${esc(t('condition.preAdoption'))}` : ''}</li>`,
        )
        .join('')}</ul>`
    : ''
}
${risks.length ? `<h2>${esc(t('pet.breedWatch'))}</h2><p class="muted">${risks.map(esc).join(' · ')}</p>` : ''}

<footer>${esc(t('summary.generated', { date: formatDate(new Date(), lang) }))} · ${esc(t('summary.disclaimer'))}</footer>
</body></html>`;
}

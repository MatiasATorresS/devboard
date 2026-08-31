/**
 * calendar.js
 * Calendario mensual que muestra entregas, reuniones y fechas límite.
 */

import { store } from '../services/store.js';
import { qs, escapeHtml } from '../utils/dom.js';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

let viewDate = new Date();

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getEventsForDate(isoDate) {
  return store.events.filter((e) => e.date === isoDate);
}

function buildDaysGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  // Lunes = 0 ... Domingo = 6
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, muted: true, date: new Date(year, month - 1, daysInPrevMonth - i) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, muted: false, date: new Date(year, month, d) });
  }
  let next = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: next, muted: true, date: new Date(year, month + 1, next) });
    next++;
  }

  return cells;
}

export function renderCalendar() {
  const container = qs('#calendar-container');
  if (!container) return;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const todayIso = toISODate(new Date());
  const cells = buildDaysGrid(year, month);

  const header = `
    <div class="calendar__header">
      <div class="calendar__title">${MONTHS_ES[month]} ${year}</div>
      <div class="calendar__nav">
        <button class="icon-btn" id="cal-prev" type="button" aria-label="Mes anterior">
          <svg viewBox="0 0 16 16" fill="none"><path d="M10 3.5 5 8l5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="btn btn--secondary btn--sm" id="cal-today" type="button">Hoy</button>
        <button class="icon-btn" id="cal-next" type="button" aria-label="Mes siguiente">
          <svg viewBox="0 0 16 16" fill="none"><path d="M6 3.5 11 8l-5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
  `;

  const weekdayHeaders = WEEKDAYS.map((w) => `<div class="calendar__weekday">${w}</div>`).join('');

  const dayCells = cells.map(({ day, muted, date }) => {
    const iso = toISODate(date);
    const isToday = iso === todayIso;
    const events = getEventsForDate(iso);
    const eventsHtml = events
      .slice(0, 3)
      .map((e) => `<div class="calendar__event calendar__event--${e.type}" title="${escapeHtml(e.title)}">${escapeHtml(e.title)}</div>`)
      .join('');

    return `
      <div class="calendar__day ${muted ? 'is-muted' : ''} ${isToday ? 'is-today' : ''}">
        <span class="calendar__day-number">${day}</span>
        ${eventsHtml}
      </div>
    `;
  }).join('');

  const legend = `
    <div class="calendar__legend">
      <span class="calendar__legend-item"><span class="calendar__legend-dot" style="background:var(--success)"></span>Entrega</span>
      <span class="calendar__legend-item"><span class="calendar__legend-dot" style="background:var(--accent-primary)"></span>Reunión</span>
      <span class="calendar__legend-item"><span class="calendar__legend-dot" style="background:var(--danger)"></span>Fecha límite</span>
    </div>
  `;

  container.innerHTML = `${header}<div class="calendar__grid">${weekdayHeaders}${dayCells}</div>${legend}`;

  qs('#cal-prev').addEventListener('click', () => { viewDate = new Date(year, month - 1, 1); renderCalendar(); });
  qs('#cal-next').addEventListener('click', () => { viewDate = new Date(year, month + 1, 1); renderCalendar(); });
  qs('#cal-today').addEventListener('click', () => { viewDate = new Date(); renderCalendar(); });
}

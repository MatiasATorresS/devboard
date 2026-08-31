/**
 * timeline.js
 * Vista de timeline tipo Gantt simplificado: una barra de progreso
 * por proyecto, basada en su avance real (`progress`).
 */

import { store } from '../services/store.js';
import { qs, escapeHtml } from '../utils/dom.js';
import { sortByField } from '../utils/sortSearch.js';

export function renderTimeline() {
  const container = qs('#timeline-container');
  if (!container) return;

  if (store.projects.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 48 48" fill="none" width="40" height="40"><path d="M6 10h36M6 24h26M6 38h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <div class="empty-state__title">Todavía no hay proyectos</div>
        <div>Crea un proyecto para ver su avance aquí.</div>
      </div>
    `;
    return;
  }

  const projects = sortByField(store.projects, 'priority', 'desc');

  container.innerHTML = projects.map((p) => `
    <div class="timeline__row">
      <div class="timeline__name">
        <span class="color-dot" style="background:${p.color}"></span>
        ${escapeHtml(p.name)}
      </div>
      <div class="timeline__track">
        <div class="timeline__fill" style="width:${p.progress}%; background:${p.color};"></div>
      </div>
      <div class="timeline__percent numeric">${p.progress}%</div>
    </div>
  `).join('');
}

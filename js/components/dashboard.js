/**
 * dashboard.js
 * Renderiza las cards de métricas del dashboard principal.
 */

import { store } from '../services/store.js';
import { renderSparkline } from './sparkline.js';
import { qs } from '../utils/dom.js';

const ICONS = {
  folder: '<svg viewBox="0 0 20 20" fill="none"><path d="M3 6a1 1 0 0 1 1-1h3.5l1.5 2H16a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  devs: '<svg viewBox="0 0 20 20" fill="none"><circle cx="7" cy="6.5" r="2.5" stroke="currentColor" stroke-width="1.6"/><path d="M2.5 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="14" cy="6.5" r="2" stroke="currentColor" stroke-width="1.4"/><path d="M12.5 12.3c1.9.3 3 1.5 3 3.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  bug: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="11" r="5" stroke="currentColor" stroke-width="1.6"/><path d="M10 6V4M7 6.5 5.5 5M13 6.5 14.5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 20 20" fill="none"><path d="M4 10.5l4 4 8-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  trend: '<svg viewBox="0 0 20 20" fill="none"><path d="M3 13l4-4 3 3 6-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  clock: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.6"/><path d="M10 6.5V10l2.6 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function metricCard({ icon, iconVariant, value, label, sparklineValues, sparklineColor, delay = 0 }) {
  return `
    <div class="metric-card" style="animation-delay:${delay}ms;">
      <div class="metric-card__top">
        <div class="metric-card__icon metric-card__icon--${iconVariant}">${icon}</div>
      </div>
      <div class="metric-card__value numeric">${value}</div>
      <div class="metric-card__label">${label}</div>
      <div class="metric-card__sparkline">${renderSparkline(sparklineValues, sparklineColor)}</div>
    </div>
  `;
}

export function renderDashboardMetrics() {
  const grid = qs('#metrics-grid');
  if (!grid) return;

  const weekly = store.weeklyProductivity;
  const completedSeries = weekly.map((w) => w.completedTasks);
  const hoursSeries = weekly.map((w) => w.hoursLogged);

  const cards = [
    metricCard({
      icon: ICONS.folder,
      iconVariant: 'primary',
      value: store.activeProjectsCount,
      label: 'Proyectos activos',
      sparklineValues: [3, 4, 4, 5, store.activeProjectsCount, store.activeProjectsCount],
      sparklineColor: '#5B8DEF',
      delay: 0,
    }),
    metricCard({
      icon: ICONS.devs,
      iconVariant: 'secondary',
      value: store.developers.length,
      label: 'Desarrolladores',
      sparklineValues: [store.developers.length, store.developers.length, store.developers.length, store.developers.length],
      sparklineColor: '#7C6FE8',
      delay: 40,
    }),
    metricCard({
      icon: ICONS.bug,
      iconVariant: 'danger',
      value: store.openBugsCount,
      label: 'Bugs abiertos',
      sparklineValues: [6, 7, 5, 8, store.openBugsCount],
      sparklineColor: '#E5484D',
      delay: 80,
    }),
    metricCard({
      icon: ICONS.check,
      iconVariant: 'success',
      value: store.resolvedBugsCount,
      label: 'Bugs resueltos',
      sparklineValues: [2, 3, 4, store.resolvedBugsCount - 1, store.resolvedBugsCount],
      sparklineColor: '#3DD68C',
      delay: 120,
    }),
    metricCard({
      icon: ICONS.trend,
      iconVariant: 'warning',
      value: `${store.productivityRate}%`,
      label: 'Productividad',
      sparklineValues: completedSeries.length ? completedSeries : [0, 0],
      sparklineColor: '#F0B429',
      delay: 160,
    }),
    metricCard({
      icon: ICONS.clock,
      iconVariant: 'neutral',
      value: `${store.avgResolutionDays}d`,
      label: 'Tiempo promedio resolución',
      sparklineValues: hoursSeries.length ? hoursSeries : [0, 0],
      sparklineColor: '#8B92A5',
      delay: 200,
    }),
  ];

  grid.innerHTML = cards.join('');
}

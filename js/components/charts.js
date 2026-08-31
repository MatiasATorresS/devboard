/**
 * charts.js
 * Configura y renderiza todos los gráficos Chart.js de la app:
 * productividad semanal, horas trabajadas, bugs por proyecto,
 * proyectos por estado, tiempo de resolución y distribución de tareas.
 */

import { store } from '../services/store.js';

const charts = {};

function readCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function baseColors() {
  return {
    primary: readCssVar('--accent-primary') || '#5B8DEF',
    secondary: readCssVar('--accent-secondary') || '#7C6FE8',
    success: readCssVar('--success') || '#3DD68C',
    warning: readCssVar('--warning') || '#F0B429',
    danger: readCssVar('--danger') || '#E5484D',
    neutral: readCssVar('--neutral') || '#8B92A5',
    text: readCssVar('--text-secondary') || '#8B92A5',
    grid: readCssVar('--border-subtle') || '#262B35',
  };
}

function destroyChart(key) {
  if (charts[key]) {
    charts[key].destroy();
    delete charts[key];
  }
}

function commonScaleOptions(colors) {
  return {
    x: {
      grid: { display: false },
      ticks: { color: colors.text, font: { family: 'Inter', size: 11 } },
    },
    y: {
      grid: { color: colors.grid },
      ticks: { color: colors.text, font: { family: 'JetBrains Mono', size: 10 } },
      beginAtZero: true,
    },
  };
}

function commonLegend(colors) {
  return {
    labels: {
      color: colors.text,
      font: { family: 'Inter', size: 12 },
      usePointStyle: true,
      pointStyle: 'circle',
    },
  };
}

export function renderWeeklyProductivityChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const colors = baseColors();
  const weekly = store.weeklyProductivity;

  charts[canvasId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: weekly.map((w) => w.week),
      datasets: [
        {
          label: 'Tareas completadas',
          data: weekly.map((w) => w.completedTasks),
          borderColor: colors.primary,
          backgroundColor: `${colors.primary}22`,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: colors.primary,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: commonScaleOptions(colors),
    },
  });
}

export function renderTaskDistributionChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const colors = baseColors();
  const data = store.tasksByStatus();

  charts[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: data.map((d) => d.status),
      datasets: [
        {
          data: data.map((d) => d.count),
          backgroundColor: [colors.neutral, colors.primary, colors.warning, colors.success],
          borderColor: readCssVar('--bg-surface') || '#13161D',
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: { legend: { position: 'bottom', ...commonLegend(colors) } },
    },
  });
}

export function renderHoursWorkedChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const colors = baseColors();
  const weekly = store.weeklyProductivity;

  charts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: weekly.map((w) => w.week),
      datasets: [
        {
          label: 'Horas registradas',
          data: weekly.map((w) => w.hoursLogged),
          backgroundColor: colors.secondary,
          borderRadius: 6,
          maxBarThickness: 36,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: commonScaleOptions(colors),
    },
  });
}

export function renderBugsByProjectChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const colors = baseColors();
  const data = store.bugsByProject().filter((d) => d.count > 0);

  charts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: data.map((d) => d.project.name),
      datasets: [
        {
          label: 'Bugs',
          data: data.map((d) => d.count),
          backgroundColor: data.map((d) => d.project.color || colors.danger),
          borderRadius: 6,
          maxBarThickness: 32,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { family: 'JetBrains Mono', size: 10 } }, beginAtZero: true },
        y: { grid: { display: false }, ticks: { color: colors.text, font: { family: 'Inter', size: 11 } } },
      },
    },
  });
}

export function renderProjectsByStatusChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const colors = baseColors();
  const statuses = ['Planificación', 'En progreso', 'Revisión', 'Completado', 'Pausado'];
  const statusColors = {
    'Planificación': colors.warning,
    'En progreso': colors.primary,
    'Revisión': colors.secondary,
    'Completado': colors.success,
    'Pausado': colors.neutral,
  };
  const counts = statuses.map((s) => store.projects.filter((p) => p.status === s).length);

  // Filtrar estados sin proyectos para no ensuciar la leyenda.
  const filtered = statuses
    .map((s, i) => ({ status: s, count: counts[i] }))
    .filter((d) => d.count > 0);

  charts[canvasId] = new Chart(canvas, {
    type: 'pie',
    data: {
      labels: filtered.map((d) => d.status),
      datasets: [
        {
          data: filtered.map((d) => d.count),
          backgroundColor: filtered.map((d) => statusColors[d.status]),
          borderColor: readCssVar('--bg-surface') || '#13161D',
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', ...commonLegend(colors) } },
    },
  });
}

export function renderResolutionTimeChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const colors = baseColors();
  const priorities = ['Baja', 'Media', 'Alta', 'Crítica'];
  const priorityColors = { Baja: colors.neutral, Media: colors.warning, Alta: colors.secondary, Crítica: colors.danger };

  const avgByPriority = priorities.map((p) => {
    const resolved = store.bugs.filter((b) => b.priority === p && b.isResolved);
    if (resolved.length === 0) return 0;
    const total = resolved.reduce((sum, b) => sum + b.daysOpen, 0);
    return Math.round((total / resolved.length) * 10) / 10;
  });

  charts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: priorities,
      datasets: [
        {
          label: 'Días promedio',
          data: avgByPriority,
          backgroundColor: priorities.map((p) => priorityColors[p]),
          borderRadius: 6,
          maxBarThickness: 44,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: commonScaleOptions(colors),
    },
  });
}

export function renderAllStatsCharts() {
  renderWeeklyProductivityChart('stats-chart-productivity');
  renderHoursWorkedChart('stats-chart-hours');
  renderBugsByProjectChart('stats-chart-bugs-project');
  renderProjectsByStatusChart('stats-chart-projects-status');
  renderResolutionTimeChart('stats-chart-resolution-time');
  renderTaskDistributionChart('stats-chart-task-distribution');
}

export function renderAllDashboardCharts() {
  renderWeeklyProductivityChart('chart-weekly-productivity');
  renderTaskDistributionChart('chart-task-distribution');
}

export function destroyAllCharts() {
  Object.keys(charts).forEach(destroyChart);
}

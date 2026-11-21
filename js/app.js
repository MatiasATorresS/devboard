/**
 * app.js
 * Punto de entrada de DevBoard. Inicializa el store, registra la
 * navegación entre vistas y arranca todos los componentes.
 */

import { store } from './services/store.js';
import { qs, qsa } from './utils/dom.js';
import { initModal } from './components/modal.js';
import { renderMetricsSkeleton, renderTableSkeleton } from './components/skeleton.js';
import { renderDashboardMetrics } from './components/dashboard.js';
import { renderAllDashboardCharts, renderAllStatsCharts } from './components/charts.js';
import { initProjectsView, renderProjectsTable } from './components/projectsView.js';
import { initTasksView, renderTasksTable } from './components/tasksView.js';
import { initBugsView, renderBugsTable } from './components/bugsView.js';
import { renderCalendar } from './components/calendar.js';
import { renderTimeline } from './components/timeline.js';
import { renderProfile } from './components/profile.js';
import { initSettings } from './components/settings.js';
import { initCommandPalette } from './components/commandPalette.js';
import { showToast } from './components/toast.js';
import { exportToJSON } from './services/export.js';

const VIEW_RENDERERS = {
  dashboard: () => { renderDashboardMetrics(); renderAllDashboardCharts(); },
  projects: renderProjectsTable,
  tasks: renderTasksTable,
  bugs: renderBugsTable,
  stats: renderAllStatsCharts,
  timeline: renderTimeline,
  calendar: renderCalendar,
  settings: () => {},
  profile: renderProfile,
};

export function navigateTo(viewName) {
  if (!VIEW_RENDERERS[viewName]) viewName = 'dashboard';

  qsa('.view').forEach((el) => el.classList.toggle('is-active', el.dataset.view === viewName));
  qsa('.nav-link').forEach((el) => {
    const isActive = el.dataset.view === viewName;
    el.classList.toggle('is-active', isActive);
    if (isActive) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });

  // Mobile bottom nav active state
  qsa('.mobile-nav__item').forEach((el) => {
    const isActive = el.dataset.view === viewName;
    el.classList.toggle('is-active', isActive);
    if (isActive) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });

  const renderer = VIEW_RENDERERS[viewName];
  if (renderer) renderer();

  // Cerrar sidebar en mobile tras navegar.
  setSidebarOpen(false);

  window.history.replaceState(null, '', `#${viewName}`);
}

/**
 * Abre/cierra el drawer lateral en móvil y bloquea el scroll del body
 * mientras está abierto.
 */
function setSidebarOpen(open) {
  const shell = qs('#app-shell');
  if (!shell) return;
  shell.classList.toggle('is-sidebar-open', open);
  document.body.classList.toggle('is-locked', open);
  const btn = qs('#mobile-menu-btn');
  if (btn) btn.setAttribute('aria-expanded', String(open));
}

function initNavigation() {
  qsa('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.view);
    });
  });

  // Mobile bottom nav
  qsa('.mobile-nav__item').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });

  qs('#profile-shortcut-btn').addEventListener('click', () => navigateTo('profile'));

  const initialView = window.location.hash.replace('#', '') || 'dashboard';
  navigateTo(initialView);
}

function initSidebarCollapse() {
  const shell = qs('#app-shell');
  const collapseBtn = qs('#collapse-btn');
  const mobileMenuBtn = qs('#mobile-menu-btn');
  const backdrop = qs('#sidebar-backdrop');

  const collapsed = localStorage.getItem('devboard:sidebar-collapsed') === 'true';
  shell.classList.toggle('is-collapsed', collapsed);

  collapseBtn.addEventListener('click', () => {
    const isCollapsed = shell.classList.toggle('is-collapsed');
    localStorage.setItem('devboard:sidebar-collapsed', String(isCollapsed));
  });

  // Tooltip nativo para el modo colapsado (solo se ven los íconos).
  qsa('.nav-link').forEach((link) => {
    const label = link.querySelector('.nav-link__label')?.textContent.trim();
    if (label) link.title = label;
  });

  mobileMenuBtn.addEventListener('click', () => {
    setSidebarOpen(!shell.classList.contains('is-sidebar-open'));
  });

  // Cierra el sidebar tocando el backdrop en mobile
  backdrop?.addEventListener('click', () => setSidebarOpen(false));

  // Escape cierra el drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shell.classList.contains('is-sidebar-open')) {
      setSidebarOpen(false);
    }
  });

  // Al volver a escritorio, asegurar que el drawer quede cerrado.
  const mobileQuery = window.matchMedia('(max-width: 880px)');
  const handleViewportChange = (event) => {
    if (!event.matches) setSidebarOpen(false);
  };
  if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', handleViewportChange);
  else mobileQuery.addListener(handleViewportChange);
}

function initGlobalExport() {
  qs('#export-btn').addEventListener('click', () => {
    const allData = {
      projects: store.projects.map((p) => p.toJSON()),
      tasks: store.tasks.map((t) => t.toJSON()),
      bugs: store.bugs.map((b) => b.toJSON()),
      developers: store.developers.map((d) => d.toJSON()),
    };
    exportToJSON(allData, 'devboard-export-completo.json');
    showToast('Datos exportados a JSON', { type: 'success' });
  });
}

async function bootstrap() {
  // Skeletons mientras se cargan/leen los datos.
  renderMetricsSkeleton(qs('#metrics-grid'));
  renderTableSkeleton(qs('#projects-table-body'), 8);
  renderTableSkeleton(qs('#tasks-table-body'), 8);
  renderTableSkeleton(qs('#bugs-table-body'), 6);

  await store.init();

  initModal();
  initNavigation();
  initSidebarCollapse();
  initProjectsView();
  initTasksView();
  initBugsView();
  initSettings();
  initCommandPalette();
  initGlobalExport();
  renderProfile();

  // Re-renderizar la vista activa con los datos ya cargados.
  const activeView = qs('.view.is-active')?.dataset.view || 'dashboard';
  navigateTo(activeView);

  showToast('DevBoard listo', { type: 'success', duration: 2000 });
}

document.addEventListener('DOMContentLoaded', bootstrap);

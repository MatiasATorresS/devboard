/**
 * settings.js
 * Gestiona tema (claro/oscuro), idioma y tamaño de fuente.
 * Persiste las preferencias en localStorage vía el módulo storage.
 */

import { storage, StorageKeys } from '../services/storage.js';
import { qs, qsa } from '../utils/dom.js';
import { showToast } from './toast.js';
import { destroyAllCharts, renderAllDashboardCharts, renderAllStatsCharts } from './charts.js';

const DEFAULT_SETTINGS = { theme: 'dark', language: 'es', fontSize: 'md' };

function getSettings() {
  return { ...DEFAULT_SETTINGS, ...storage.get(StorageKeys.SETTINGS, {}) };
}

function saveSettings(partial) {
  const updated = { ...getSettings(), ...partial };
  storage.set(StorageKeys.SETTINGS, updated);
  return updated;
}

function applySettingsToDOM(settings) {
  document.documentElement.setAttribute('data-theme', settings.theme);
  document.documentElement.setAttribute('data-font-size', settings.fontSize);

  // Barra del navegador en móvil a juego con el tema.
  const themeMeta = document.getElementById('theme-color-meta');
  if (themeMeta) {
    themeMeta.setAttribute('content', settings.theme === 'dark' ? '#080A10' : '#F1F3F8');
  }

  const themeIcon = qs('#theme-icon');
  if (themeIcon) {
    themeIcon.innerHTML = settings.theme === 'dark'
      ? '<path d="M17 11.5A7 7 0 1 1 8.5 3a5.6 5.6 0 0 0 8.5 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'
      : '<circle cx="10" cy="10" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
  }

  const settingsToggle = qs('#settings-theme-toggle');
  if (settingsToggle) settingsToggle.setAttribute('aria-pressed', settings.theme === 'dark');

  qsa('#settings-language .segmented__option').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.value === settings.language);
  });
  qsa('#settings-font-size .segmented__option').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.value === settings.fontSize);
  });

  // Los gráficos Chart.js leen colores fijos al crearse: hay que
  // reconstruirlos para que tomen los nuevos valores de las CSS vars.
  destroyAllCharts();
  const dashboardView = document.getElementById('view-dashboard');
  const statsView = document.getElementById('view-stats');
  if (dashboardView) renderAllDashboardCharts();
  if (statsView) renderAllStatsCharts();
}

function toggleTheme() {
  const current = getSettings();
  const next = current.theme === 'dark' ? 'light' : 'dark';
  const updated = saveSettings({ theme: next });
  applySettingsToDOM(updated);
}

export function initSettings() {
  const settings = getSettings();
  applySettingsToDOM(settings);

  qs('#theme-toggle-btn').addEventListener('click', toggleTheme);
  qs('#settings-theme-toggle').addEventListener('click', toggleTheme);

  qsa('#settings-language .segmented__option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const updated = saveSettings({ language: btn.dataset.value });
      applySettingsToDOM(updated);
      if (btn.dataset.value === 'en') {
        showToast('Language switching is visual only in this demo', { type: 'info' });
      } else {
        showToast('Idioma actualizado', { type: 'success' });
      }
    });
  });

  qsa('#settings-font-size .segmented__option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const updated = saveSettings({ fontSize: btn.dataset.value });
      applySettingsToDOM(updated);
      showToast('Tamaño de fuente actualizado', { type: 'success' });
    });
  });
}

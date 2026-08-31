/**
 * commandPalette.js
 * Buscador global activado con CTRL+K (estilo VS Code) que busca
 * a través de proyectos, tareas, bugs y desarrolladores.
 */

import { store } from '../services/store.js';
import { globalSearch } from '../utils/sortSearch.js';
import { qs, escapeHtml, debounce } from '../utils/dom.js';
import { navigateTo } from '../app.js';

let overlay, input, resultsContainer;
let activeIndex = -1;
let currentResults = [];

const TYPE_TO_VIEW = { Proyecto: 'projects', Tarea: 'tasks', Bug: 'bugs', Desarrollador: 'profile' };

function renderResults(results) {
  currentResults = results;
  activeIndex = results.length > 0 ? 0 : -1;

  if (!input.value.trim()) {
    resultsContainer.innerHTML = `<div class="palette__empty">Escribe para buscar en proyectos, tareas, bugs y desarrolladores.</div>`;
    return;
  }

  if (results.length === 0) {
    resultsContainer.innerHTML = `<div class="palette__empty">Sin resultados para "${escapeHtml(input.value)}".</div>`;
    return;
  }

  resultsContainer.innerHTML = results.map((r, i) => `
    <div class="palette__item ${i === 0 ? 'is-active' : ''}" data-index="${i}">
      <span class="palette__item-type">${r.type}</span>
      <span class="palette__item-label">${escapeHtml(r.label)}</span>
      <span class="palette__item-sublabel">${escapeHtml(r.sublabel || '')}</span>
    </div>
  `).join('');
}

function highlightActive() {
  resultsContainer.querySelectorAll('.palette__item').forEach((el, i) => {
    el.classList.toggle('is-active', i === activeIndex);
  });
  const activeEl = resultsContainer.querySelector('.palette__item.is-active');
  if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
}

function selectResult(index) {
  const result = currentResults[index];
  if (!result) return;
  closePalette();
  const view = TYPE_TO_VIEW[result.type] || 'dashboard';
  navigateTo(view);
}

export function openPalette() {
  overlay.classList.add('is-open');
  input.value = '';
  renderResults([]);
  setTimeout(() => input.focus(), 60);
}

export function closePalette() {
  overlay.classList.remove('is-open');
}

export function initCommandPalette() {
  overlay = qs('#palette-overlay');
  input = qs('#palette-input');
  resultsContainer = qs('#palette-results');

  qs('#open-palette-btn').addEventListener('click', openPalette);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePalette();
  });

  document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const cmdK = (isMac && e.metaKey && e.key.toLowerCase() === 'k') || (!isMac && e.ctrlKey && e.key.toLowerCase() === 'k');
    if (cmdK) {
      e.preventDefault();
      overlay.classList.contains('is-open') ? closePalette() : openPalette();
      return;
    }
    if (!overlay.classList.contains('is-open')) return;

    if (e.key === 'Escape') closePalette();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, currentResults.length - 1);
      highlightActive();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      highlightActive();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      selectResult(activeIndex);
    }
  });

  input.addEventListener('input', debounce(() => {
    const results = globalSearch(store, input.value);
    renderResults(results);
  }, 120));

  resultsContainer.addEventListener('click', (e) => {
    const item = e.target.closest('.palette__item');
    if (!item) return;
    selectResult(Number(item.dataset.index));
  });
}

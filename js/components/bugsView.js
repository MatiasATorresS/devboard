/**
 * bugsView.js
 * Vista de gestión de bugs: tabla, filtros, búsqueda, ordenamiento
 * y CRUD a través del modal genérico.
 */

import { store } from '../services/store.js';
import { sortByField, searchByFields } from '../utils/sortSearch.js';
import { formatShortDate, isoToday } from '../utils/format.js';
import { escapeHtml, qs, qsa, debounce } from '../utils/dom.js';
import { openModal, closeModal } from './modal.js';
import { showToast } from './toast.js';
import { exportToCSV } from '../services/export.js';
import { BUG_STATUS } from '../models/Bug.js';
import { PRIORITY_LEVELS } from '../models/Project.js';

const STATUS_BADGE = { Abierto: 'danger', 'En progreso': 'warning', Resuelto: 'success' };
const PRIORITY_BADGE = { Baja: 'neutral', Media: 'warning', Alta: 'secondary', Crítica: 'danger' };

let state = { search: '', project: '', status: '', priority: '', sortField: 'date', sortDir: 'desc' };

function getFilteredBugs() {
  let list = store.bugs;
  list = searchByFields(list, state.search, ['description']);
  if (state.project) list = list.filter((b) => b.projectId === state.project);
  if (state.status) list = list.filter((b) => b.status === state.status);
  if (state.priority) list = list.filter((b) => b.priority === state.priority);
  return sortByField(list, state.sortField, state.sortDir);
}

function populateFilterOptions() {
  const projectSelect = qs('#bugs-filter-project');
  projectSelect.innerHTML = '<option value="">Proyecto</option>' + store.projects.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');

  const statusSelect = qs('#bugs-filter-status');
  statusSelect.innerHTML = '<option value="">Estado</option>' + BUG_STATUS.map((s) => `<option value="${s}">${s}</option>`).join('');

  const prioritySelect = qs('#bugs-filter-priority');
  prioritySelect.innerHTML = '<option value="">Prioridad</option>' + PRIORITY_LEVELS.map((p) => `<option value="${p}">${p}</option>`).join('');
}

function renderRow(bug) {
  const project = store.getProjectById(bug.projectId);

  return `
    <tr data-id="${bug.id}">
      <td class="cell-truncate" data-label="Descripción"><div class="cell-primary">${escapeHtml(bug.description)}</div></td>
      <td data-label="Proyecto">${project ? `<span class="cell-inline"><span class="color-dot" style="background:${project.color}"></span>${escapeHtml(project.name)}</span>` : '—'}</td>
      <td data-label="Prioridad"><span class="badge badge--${PRIORITY_BADGE[bug.priority] || 'neutral'}">${bug.priority}</span></td>
      <td data-label="Estado"><span class="badge badge--${STATUS_BADGE[bug.status] || 'neutral'}">${bug.status}</span></td>
      <td class="numeric" data-label="Fecha">${formatShortDate(bug.date)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn btn--sm" data-action="edit" title="Editar" aria-label="Editar bug">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M11 2.5l2.5 2.5L5 13.5H2.5V11L11 2.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          </button>
          <button class="icon-btn btn--sm" data-action="delete" title="Eliminar" aria-label="Eliminar bug">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4.5 4.5l.6 8.4A1 1 0 0 0 6.1 14h3.8a1 1 0 0 0 1-1.1l.6-8.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

export function renderBugsTable() {
  const tbody = qs('#bugs-table-body');
  if (!tbody) return;
  const list = getFilteredBugs();

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="table-empty">
          <svg viewBox="0 0 48 48" fill="none" width="40" height="40"><circle cx="24" cy="26" r="12" stroke="currentColor" stroke-width="1.5"/><path d="M24 14V9M18 15l-3-3M30 15l3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <div>No hay bugs que coincidan con los filtros.</div>
        </div>
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(renderRow).join('');

  qsa('#view-bugs thead th[data-sort]').forEach((th) => {
    const field = th.dataset.sort;
    th.classList.toggle('is-sorted', state.sortField === field);
    th.classList.toggle('is-sorted-desc', state.sortField === field && state.sortDir === 'desc');
  });
}

function bugFormHtml(bug = null) {
  return `
    <form id="bug-form" novalidate>
      <div class="field">
        <label class="field__label" for="b-description">Descripción</label>
        <textarea id="b-description" name="description" placeholder="Describe el problema...">${escapeHtml(bug?.description || '')}</textarea>
        <div class="field__error" id="err-b-description"></div>
      </div>
      <div class="field">
        <label class="field__label" for="b-project">Proyecto</label>
        <select id="b-project" name="projectId" required>
          ${store.projects.map((p) => `<option value="${p.id}" ${bug?.projectId === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
        </select>
      </div>
      <div class="field__row">
        <div class="field">
          <label class="field__label" for="b-priority">Prioridad</label>
          <select id="b-priority" name="priority">
            ${PRIORITY_LEVELS.map((p) => `<option value="${p}" ${bug?.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field__label" for="b-status">Estado</label>
          <select id="b-status" name="status">
            ${BUG_STATUS.map((s) => `<option value="${s}" ${bug?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field">
        <label class="field__label" for="b-date">Fecha</label>
        <input type="date" id="b-date" name="date" value="${bug?.date || isoToday()}">
      </div>
    </form>
  `;
}

function openBugModal(bug = null) {
  if (store.projects.length === 0) {
    showToast('Crea primero un proyecto para poder registrar bugs', { type: 'error' });
    return;
  }

  openModal({
    title: bug ? 'Editar bug' : 'Nuevo bug',
    bodyHtml: bugFormHtml(bug),
    footerHtml: `
      <button class="btn btn--ghost" id="modal-cancel-btn" type="button">Cancelar</button>
      <button class="btn btn--primary" id="modal-save-btn" type="button">${bug ? 'Guardar cambios' : 'Registrar bug'}</button>
    `,
    onMount: (body, footer) => {
      qs('#modal-cancel-btn', footer).addEventListener('click', closeModal);
      qs('#modal-save-btn', footer).addEventListener('click', () => {
        const form = qs('#bug-form', body);
        const data = {
          description: form.description.value.trim(),
          projectId: form.projectId.value,
          priority: form.priority.value,
          status: form.status.value,
          date: form.date.value || isoToday(),
        };

        qs('#err-b-description', body).textContent = '';
        if (!data.description) { qs('#err-b-description', body).textContent = 'La descripción es obligatoria.'; return; }

        try {
          if (bug) {
            store.updateBug(bug.id, data);
            showToast('Bug actualizado', { type: 'success' });
          } else {
            store.addBug(data);
            showToast('Bug agregado', { type: 'success' });
          }
          closeModal();
        } catch (err) {
          showToast(err.message, { type: 'error' });
        }
      });
    },
  });
}

function confirmDeleteBug(bug) {
  openModal({
    title: 'Eliminar bug',
    bodyHtml: `<p>¿Eliminar este registro de bug? Esta acción no se puede deshacer.</p>`,
    footerHtml: `
      <button class="btn btn--ghost" id="modal-cancel-btn" type="button">Cancelar</button>
      <button class="btn btn--danger" id="modal-delete-btn" type="button">Eliminar</button>
    `,
    onMount: (body, footer) => {
      qs('#modal-cancel-btn', footer).addEventListener('click', closeModal);
      qs('#modal-delete-btn', footer).addEventListener('click', () => {
        store.removeBug(bug.id);
        showToast('Bug eliminado', { type: 'info' });
        closeModal();
      });
    },
  });
}

export function initBugsView() {
  populateFilterOptions();
  renderBugsTable();

  qs('#bugs-search').addEventListener('input', debounce((e) => {
    state.search = e.target.value;
    renderBugsTable();
  }, 200));

  qs('#bugs-filter-project').addEventListener('change', (e) => { state.project = e.target.value; renderBugsTable(); });
  qs('#bugs-filter-status').addEventListener('change', (e) => { state.status = e.target.value; renderBugsTable(); });
  qs('#bugs-filter-priority').addEventListener('change', (e) => { state.priority = e.target.value; renderBugsTable(); });

  qsa('#view-bugs thead th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (state.sortField === field) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortField = field;
        state.sortDir = 'asc';
      }
      renderBugsTable();
    });
  });

  qs('#bugs-table-body').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const row = btn.closest('tr');
    const bug = store.getBugById(row.dataset.id);
    if (!bug) return;
    if (btn.dataset.action === 'edit') openBugModal(bug);
    if (btn.dataset.action === 'delete') confirmDeleteBug(bug);
  });

  qs('#bugs-new-btn').addEventListener('click', () => openBugModal());

  qs('#bugs-export-btn').addEventListener('click', () => {
    exportToCSV(getFilteredBugs().map((b) => b.toJSON()), 'devboard-bugs.csv');
    showToast('Bugs exportados a CSV', { type: 'success' });
  });

  store.addEventListener('bugs:changed', renderBugsTable);
  store.addEventListener('projects:changed', () => {
    populateFilterOptions();
    renderBugsTable();
  });
}

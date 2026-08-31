/**
 * projectsView.js
 * Vista de gestión de proyectos: tabla, filtros, búsqueda, ordenamiento
 * y CRUD a través del modal genérico.
 */

import { store } from '../services/store.js';
import { sortByField, searchByFields } from '../utils/sortSearch.js';
import { formatShortDate, isoToday } from '../utils/format.js';
import { escapeHtml, qs, qsa, debounce } from '../utils/dom.js';
import { openModal, closeModal } from './modal.js';
import { showToast } from './toast.js';
import { exportToCSV, exportToJSON } from '../services/export.js';
import { PROJECT_STATUS, PRIORITY_LEVELS } from '../models/Project.js';

const STATUS_BADGE = {
  'Planificación': 'warning',
  'En progreso': 'primary',
  'Revisión': 'secondary',
  'Completado': 'success',
  'Pausado': 'neutral',
};

const PRIORITY_BADGE = {
  Baja: 'neutral',
  Media: 'warning',
  Alta: 'secondary',
  Crítica: 'danger',
};

const PROJECT_COLORS = ['#5B8DEF', '#7C6FE8', '#3DD68C', '#F0B429', '#E5484D', '#8B92A5'];

let state = { search: '', client: '', status: '', priority: '', sortField: 'name', sortDir: 'asc' };

function getFilteredProjects() {
  let list = store.projects;
  list = searchByFields(list, state.search, ['name', 'client']);
  if (state.client) list = list.filter((p) => p.client === state.client);
  if (state.status) list = list.filter((p) => p.status === state.status);
  if (state.priority) list = list.filter((p) => p.priority === state.priority);
  return sortByField(list, state.sortField, state.sortDir);
}

function populateFilterOptions() {
  const clientSelect = qs('#projects-filter-client');
  const clients = [...new Set(store.projects.map((p) => p.client))].sort();
  clientSelect.innerHTML = '<option value="">Cliente</option>' + clients.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

  const statusSelect = qs('#projects-filter-status');
  statusSelect.innerHTML = '<option value="">Estado</option>' + PROJECT_STATUS.map((s) => `<option value="${s}">${s}</option>`).join('');

  const prioritySelect = qs('#projects-filter-priority');
  prioritySelect.innerHTML = '<option value="">Prioridad</option>' + PRIORITY_LEVELS.map((p) => `<option value="${p}">${p}</option>`).join('');
}

function renderRow(project) {
  const taskCount = store.tasks.filter((t) => t.projectId === project.id).length;
  const bugCount = store.bugs.filter((b) => b.projectId === project.id).length;

  return `
    <tr data-id="${project.id}">
      <td>
        <div class="cell-primary">
          <span class="color-dot" style="background:${project.color}"></span>
          ${escapeHtml(project.name)}
        </div>
      </td>
      <td>${escapeHtml(project.client)}</td>
      <td class="numeric">${formatShortDate(project.startDate)}</td>
      <td class="numeric">${formatShortDate(project.endDate)}</td>
      <td><span class="badge badge--${STATUS_BADGE[project.status] || 'neutral'}">${project.status}</span></td>
      <td><span class="badge badge--${PRIORITY_BADGE[project.priority] || 'neutral'}">${project.priority}</span></td>
      <td style="min-width:120px;">
        <div class="progress-bar">
          <div class="progress-bar__fill" style="width:${project.progress}%; background:${project.color};"></div>
        </div>
      </td>
      <td>
        <div class="row-actions">
          <button class="icon-btn btn--sm" data-action="edit" title="Editar" aria-label="Editar ${escapeHtml(project.name)}">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M11 2.5l2.5 2.5L5 13.5H2.5V11L11 2.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          </button>
          <button class="icon-btn btn--sm" data-action="delete" title="Eliminar" aria-label="Eliminar ${escapeHtml(project.name)}">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4.5 4.5l.6 8.4A1 1 0 0 0 6.1 14h3.8a1 1 0 0 0 1-1.1l.6-8.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

export function renderProjectsTable() {
  const tbody = qs('#projects-table-body');
  if (!tbody) return;
  const list = getFilteredProjects();

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8">
        <div class="table-empty">
          <svg viewBox="0 0 48 48" fill="none" width="40" height="40"><path d="M8 14a2 2 0 0 1 2-2h8l3 4h19a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V14Z" stroke="currentColor" stroke-width="1.5"/></svg>
          <div>No hay proyectos que coincidan con los filtros.</div>
        </div>
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(renderRow).join('');

  qsa('thead th[data-sort]').forEach((th) => {
    const field = th.dataset.sort;
    th.classList.toggle('is-sorted', state.sortField === field);
    th.classList.toggle('is-sorted-desc', state.sortField === field && state.sortDir === 'desc');
  });
}

function projectFormHtml(project = null) {
  const colorOptions = PROJECT_COLORS.map(
    (c) => `<span class="color-swatch ${project && project.color === c ? 'is-selected' : (!project && c === PROJECT_COLORS[0] ? 'is-selected' : '')}" data-color="${c}" style="background:${c};"></span>`
  ).join('');

  return `
    <form id="project-form" novalidate>
      <div class="field">
        <label class="field__label" for="f-name">Nombre del proyecto</label>
        <input type="text" id="f-name" name="name" value="${escapeHtml(project?.name || '')}" placeholder="Ej: Nimbus Payments" required>
        <div class="field__error" id="err-name"></div>
      </div>
      <div class="field">
        <label class="field__label" for="f-client">Cliente</label>
        <input type="text" id="f-client" name="client" value="${escapeHtml(project?.client || '')}" placeholder="Ej: Banco Andes" required>
        <div class="field__error" id="err-client"></div>
      </div>
      <div class="field__row">
        <div class="field">
          <label class="field__label" for="f-start">Fecha inicio</label>
          <input type="date" id="f-start" name="startDate" value="${project?.startDate || isoToday()}" required>
        </div>
        <div class="field">
          <label class="field__label" for="f-end">Fecha término</label>
          <input type="date" id="f-end" name="endDate" value="${project?.endDate || ''}" required>
        </div>
      </div>
      <div class="field__error" id="err-dates"></div>
      <div class="field__row">
        <div class="field">
          <label class="field__label" for="f-status">Estado</label>
          <select id="f-status" name="status">
            ${PROJECT_STATUS.map((s) => `<option value="${s}" ${project?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field__label" for="f-priority">Prioridad</label>
          <select id="f-priority" name="priority">
            ${PRIORITY_LEVELS.map((p) => `<option value="${p}" ${project?.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field">
        <label class="field__label">Color</label>
        <div class="color-swatches" id="color-swatches">${colorOptions}</div>
        <input type="hidden" id="f-color" name="color" value="${project?.color || PROJECT_COLORS[0]}">
      </div>
      <div class="field">
        <label class="field__label" for="f-progress">Avance (%)</label>
        <input type="number" id="f-progress" name="progress" min="0" max="100" value="${project?.progress ?? 0}">
      </div>
    </form>
  `;
}

function openProjectModal(project = null) {
  openModal({
    title: project ? 'Editar proyecto' : 'Nuevo proyecto',
    bodyHtml: projectFormHtml(project),
    footerHtml: `
      <button class="btn btn--ghost" id="modal-cancel-btn" type="button">Cancelar</button>
      <button class="btn btn--primary" id="modal-save-btn" type="button">${project ? 'Guardar cambios' : 'Crear proyecto'}</button>
    `,
    onMount: (body, footer) => {
      qsa('.color-swatch', body).forEach((swatch) => {
        swatch.addEventListener('click', () => {
          qsa('.color-swatch', body).forEach((s) => s.classList.remove('is-selected'));
          swatch.classList.add('is-selected');
          qs('#f-color', body).value = swatch.dataset.color;
        });
      });

      qs('#modal-cancel-btn', footer).addEventListener('click', closeModal);
      qs('#modal-save-btn', footer).addEventListener('click', () => {
        const form = qs('#project-form', body);
        const data = {
          name: form.name.value.trim(),
          client: form.client.value.trim(),
          startDate: form.startDate.value,
          endDate: form.endDate.value,
          status: form.status.value,
          priority: form.priority.value,
          color: form.color.value,
          progress: Number(form.progress.value) || 0,
        };

        let valid = true;
        qs('#err-name', body).textContent = '';
        qs('#err-client', body).textContent = '';
        qs('#err-dates', body).textContent = '';

        if (!data.name) { qs('#err-name', body).textContent = 'El nombre es obligatorio.'; valid = false; }
        if (!data.client) { qs('#err-client', body).textContent = 'El cliente es obligatorio.'; valid = false; }
        if (data.startDate && data.endDate && data.endDate < data.startDate) {
          qs('#err-dates', body).textContent = 'La fecha de término no puede ser anterior al inicio.';
          valid = false;
        }
        if (!valid) return;

        try {
          if (project) {
            store.updateProject(project.id, data);
            showToast('Proyecto actualizado', { type: 'success' });
          } else {
            store.addProject(data);
            showToast('Proyecto creado', { type: 'success' });
          }
          closeModal();
        } catch (err) {
          showToast(err.message, { type: 'error' });
        }
      });
    },
  });
}

function confirmDeleteProject(project) {
  openModal({
    title: 'Eliminar proyecto',
    bodyHtml: `<p>¿Eliminar <strong>${escapeHtml(project.name)}</strong>? También se eliminarán sus tareas y bugs asociados. Esta acción no se puede deshacer.</p>`,
    footerHtml: `
      <button class="btn btn--ghost" id="modal-cancel-btn" type="button">Cancelar</button>
      <button class="btn btn--danger" id="modal-delete-btn" type="button">Eliminar</button>
    `,
    onMount: (body, footer) => {
      qs('#modal-cancel-btn', footer).addEventListener('click', closeModal);
      qs('#modal-delete-btn', footer).addEventListener('click', () => {
        store.removeProject(project.id);
        showToast('Proyecto eliminado', { type: 'info' });
        closeModal();
      });
    },
  });
}

export function initProjectsView() {
  populateFilterOptions();
  renderProjectsTable();

  qs('#projects-search').addEventListener('input', debounce((e) => {
    state.search = e.target.value;
    renderProjectsTable();
  }, 200));

  qs('#projects-filter-client').addEventListener('change', (e) => { state.client = e.target.value; renderProjectsTable(); });
  qs('#projects-filter-status').addEventListener('change', (e) => { state.status = e.target.value; renderProjectsTable(); });
  qs('#projects-filter-priority').addEventListener('change', (e) => { state.priority = e.target.value; renderProjectsTable(); });

  qsa('thead th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (state.sortField === field) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortField = field;
        state.sortDir = 'asc';
      }
      renderProjectsTable();
    });
  });

  qs('#projects-table-body').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const row = btn.closest('tr');
    const project = store.getProjectById(row.dataset.id);
    if (!project) return;
    if (btn.dataset.action === 'edit') openProjectModal(project);
    if (btn.dataset.action === 'delete') confirmDeleteProject(project);
  });

  const newBtn = qs('#projects-new-btn');
  if (newBtn) newBtn.addEventListener('click', () => openProjectModal());

  const dashboardNewBtn = qs('#dashboard-new-project-btn');
  if (dashboardNewBtn) dashboardNewBtn.addEventListener('click', () => openProjectModal());

  qs('#projects-export-btn').addEventListener('click', () => {
    exportToCSV(
      getFilteredProjects().map((p) => p.toJSON()),
      'devboard-proyectos.csv'
    );
    showToast('Proyectos exportados a CSV', { type: 'success' });
  });

  store.addEventListener('projects:changed', () => {
    populateFilterOptions();
    renderProjectsTable();
  });
  store.addEventListener('tasks:changed', renderProjectsTable);
  store.addEventListener('bugs:changed', renderProjectsTable);
}

export function exportProjectsJSON() {
  exportToJSON(store.projects.map((p) => p.toJSON()), 'devboard-proyectos.json');
}

/**
 * tasksView.js
 * Vista de gestión de tareas: tabla, filtros, búsqueda, ordenamiento
 * y CRUD a través del modal genérico.
 */

import { store } from '../services/store.js';
import { sortByField, searchByFields } from '../utils/sortSearch.js';
import { escapeHtml, qs, qsa, debounce } from '../utils/dom.js';
import { openModal, closeModal } from './modal.js';
import { showToast } from './toast.js';
import { exportToCSV } from '../services/export.js';
import { TASK_STATUS } from '../models/Task.js';
import { PRIORITY_LEVELS } from '../models/Project.js';

const STATUS_BADGE = {
  Pendiente: 'neutral',
  'En progreso': 'primary',
  'En revisión': 'secondary',
  Completada: 'success',
};

const PRIORITY_BADGE = { Baja: 'neutral', Media: 'warning', Alta: 'secondary', Crítica: 'danger' };

let state = { search: '', project: '', status: '', priority: '', sortField: 'name', sortDir: 'asc' };

function getFilteredTasks() {
  let list = store.tasks;
  list = searchByFields(list, state.search, ['name']);
  if (state.project) list = list.filter((t) => t.projectId === state.project);
  if (state.status) list = list.filter((t) => t.status === state.status);
  if (state.priority) list = list.filter((t) => t.priority === state.priority);
  return sortByField(list, state.sortField, state.sortDir);
}

function populateFilterOptions() {
  const projectSelect = qs('#tasks-filter-project');
  projectSelect.innerHTML = '<option value="">Proyecto</option>' + store.projects.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');

  const statusSelect = qs('#tasks-filter-status');
  statusSelect.innerHTML = '<option value="">Estado</option>' + TASK_STATUS.map((s) => `<option value="${s}">${s}</option>`).join('');

  const prioritySelect = qs('#tasks-filter-priority');
  prioritySelect.innerHTML = '<option value="">Prioridad</option>' + PRIORITY_LEVELS.map((p) => `<option value="${p}">${p}</option>`).join('');
}

function renderRow(task) {
  const project = store.getProjectById(task.projectId);
  const assignee = store.getDeveloperById(task.assigneeId);
  const overHours = task.actualHours > task.estimatedHours && task.estimatedHours > 0;

  return `
    <tr data-id="${task.id}">
      <td data-label="Tarea"><div class="cell-primary">${escapeHtml(task.name)}</div></td>
      <td data-label="Proyecto">${project ? `<span class="cell-inline"><span class="color-dot" style="background:${project.color}"></span>${escapeHtml(project.name)}</span>` : '—'}</td>
      <td data-label="Responsable">
        ${assignee
          ? `<div class="avatar-stack"><div class="avatar" style="background:${assignee.avatarColor}">${assignee.initials}</div>${escapeHtml(assignee.name)}</div>`
          : '<span style="color:var(--text-tertiary)">Sin asignar</span>'}
      </td>
      <td data-label="Estado"><span class="badge badge--${STATUS_BADGE[task.status] || 'neutral'}">${task.status}</span></td>
      <td data-label="Prioridad"><span class="badge badge--${PRIORITY_BADGE[task.priority] || 'neutral'}">${task.priority}</span></td>
      <td class="numeric" data-label="Est.">${task.estimatedHours}h</td>
      <td class="numeric" data-label="Real" style="color:${overHours ? 'var(--danger)' : 'inherit'}">${task.actualHours}h</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn btn--sm" data-action="edit" title="Editar" aria-label="Editar ${escapeHtml(task.name)}">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M11 2.5l2.5 2.5L5 13.5H2.5V11L11 2.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          </button>
          <button class="icon-btn btn--sm" data-action="delete" title="Eliminar" aria-label="Eliminar ${escapeHtml(task.name)}">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4.5 4.5l.6 8.4A1 1 0 0 0 6.1 14h3.8a1 1 0 0 0 1-1.1l.6-8.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

export function renderTasksTable() {
  const tbody = qs('#tasks-table-body');
  if (!tbody) return;
  const list = getFilteredTasks();

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8">
        <div class="table-empty">
          <svg viewBox="0 0 48 48" fill="none" width="40" height="40"><rect x="9" y="8" width="30" height="32" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M16 18h16M16 26h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <div>No hay tareas que coincidan con los filtros.</div>
        </div>
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(renderRow).join('');

  qsa('#view-tasks thead th[data-sort]').forEach((th) => {
    const field = th.dataset.sort;
    th.classList.toggle('is-sorted', state.sortField === field);
    th.classList.toggle('is-sorted-desc', state.sortField === field && state.sortDir === 'desc');
  });
}

function taskFormHtml(task = null) {
  return `
    <form id="task-form" novalidate>
      <div class="field">
        <label class="field__label" for="t-name">Nombre de la tarea</label>
        <input type="text" id="t-name" name="name" value="${escapeHtml(task?.name || '')}" placeholder="Ej: Integrar pasarela de pago" required>
        <div class="field__error" id="err-t-name"></div>
      </div>
      <div class="field__row">
        <div class="field">
          <label class="field__label" for="t-project">Proyecto</label>
          <select id="t-project" name="projectId" required>
            ${store.projects.map((p) => `<option value="${p.id}" ${task?.projectId === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field__label" for="t-assignee">Responsable</label>
          <select id="t-assignee" name="assigneeId">
            <option value="">Sin asignar</option>
            ${store.developers.map((d) => `<option value="${d.id}" ${task?.assigneeId === d.id ? 'selected' : ''}>${escapeHtml(d.name)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field__row">
        <div class="field">
          <label class="field__label" for="t-status">Estado</label>
          <select id="t-status" name="status">
            ${TASK_STATUS.map((s) => `<option value="${s}" ${task?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field__label" for="t-priority">Prioridad</label>
          <select id="t-priority" name="priority">
            ${PRIORITY_LEVELS.map((p) => `<option value="${p}" ${task?.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field__row">
        <div class="field">
          <label class="field__label" for="t-estimated">Horas estimadas</label>
          <input type="number" id="t-estimated" name="estimatedHours" min="0" step="0.5" value="${task?.estimatedHours ?? 0}">
        </div>
        <div class="field">
          <label class="field__label" for="t-actual">Horas reales</label>
          <input type="number" id="t-actual" name="actualHours" min="0" step="0.5" value="${task?.actualHours ?? 0}">
        </div>
      </div>
      <div class="field">
        <label class="field__label" for="t-due">Fecha límite</label>
        <input type="date" id="t-due" name="dueDate" value="${task?.dueDate || ''}">
      </div>
    </form>
  `;
}

function openTaskModal(task = null) {
  if (store.projects.length === 0) {
    showToast('Crea primero un proyecto para poder agregar tareas', { type: 'error' });
    return;
  }

  openModal({
    title: task ? 'Editar tarea' : 'Nueva tarea',
    bodyHtml: taskFormHtml(task),
    footerHtml: `
      <button class="btn btn--ghost" id="modal-cancel-btn" type="button">Cancelar</button>
      <button class="btn btn--primary" id="modal-save-btn" type="button">${task ? 'Guardar cambios' : 'Crear tarea'}</button>
    `,
    onMount: (body, footer) => {
      qs('#modal-cancel-btn', footer).addEventListener('click', closeModal);
      qs('#modal-save-btn', footer).addEventListener('click', () => {
        const form = qs('#task-form', body);
        const data = {
          name: form.name.value.trim(),
          projectId: form.projectId.value,
          assigneeId: form.assigneeId.value || null,
          status: form.status.value,
          priority: form.priority.value,
          estimatedHours: Number(form.estimatedHours.value) || 0,
          actualHours: Number(form.actualHours.value) || 0,
          dueDate: form.dueDate.value || null,
        };

        qs('#err-t-name', body).textContent = '';
        if (!data.name) { qs('#err-t-name', body).textContent = 'El nombre es obligatorio.'; return; }

        try {
          if (task) {
            store.updateTask(task.id, data);
            showToast('Tarea actualizada', { type: 'success' });
          } else {
            store.addTask(data);
            showToast('Tarea completada... ¡no, creada!', { type: 'success' });
          }
          closeModal();
        } catch (err) {
          showToast(err.message, { type: 'error' });
        }
      });
    },
  });
}

function confirmDeleteTask(task) {
  openModal({
    title: 'Eliminar tarea',
    bodyHtml: `<p>¿Eliminar la tarea <strong>${escapeHtml(task.name)}</strong>? Esta acción no se puede deshacer.</p>`,
    footerHtml: `
      <button class="btn btn--ghost" id="modal-cancel-btn" type="button">Cancelar</button>
      <button class="btn btn--danger" id="modal-delete-btn" type="button">Eliminar</button>
    `,
    onMount: (body, footer) => {
      qs('#modal-cancel-btn', footer).addEventListener('click', closeModal);
      qs('#modal-delete-btn', footer).addEventListener('click', () => {
        store.removeTask(task.id);
        showToast('Tarea eliminada', { type: 'info' });
        closeModal();
      });
    },
  });
}

export function initTasksView() {
  populateFilterOptions();
  renderTasksTable();

  qs('#tasks-search').addEventListener('input', debounce((e) => {
    state.search = e.target.value;
    renderTasksTable();
  }, 200));

  qs('#tasks-filter-project').addEventListener('change', (e) => { state.project = e.target.value; renderTasksTable(); });
  qs('#tasks-filter-status').addEventListener('change', (e) => { state.status = e.target.value; renderTasksTable(); });
  qs('#tasks-filter-priority').addEventListener('change', (e) => { state.priority = e.target.value; renderTasksTable(); });

  qsa('#view-tasks thead th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (state.sortField === field) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortField = field;
        state.sortDir = 'asc';
      }
      renderTasksTable();
    });
  });

  qs('#tasks-table-body').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const row = btn.closest('tr');
    const task = store.getTaskById(row.dataset.id);
    if (!task) return;
    if (btn.dataset.action === 'edit') openTaskModal(task);
    if (btn.dataset.action === 'delete') confirmDeleteTask(task);
  });

  qs('#tasks-new-btn').addEventListener('click', () => openTaskModal());

  qs('#tasks-export-btn').addEventListener('click', () => {
    exportToCSV(getFilteredTasks().map((t) => t.toJSON()), 'devboard-tareas.csv');
    showToast('Tareas exportadas a CSV', { type: 'success' });
  });

  store.addEventListener('tasks:changed', renderTasksTable);
  store.addEventListener('projects:changed', () => {
    populateFilterOptions();
    renderTasksTable();
  });
}

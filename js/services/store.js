/**
 * store.js
 * Estado central de la aplicación. Mantiene proyectos, tareas, bugs y
 * desarrolladores en memoria, los sincroniza con localStorage y notifica
 * a quien esté suscrito (patrón observer) cuando algo cambia.
 *
 * Nadie debe mutar los arrays devueltos por los getters: siempre pasar
 * por los métodos add/update/remove para que la persistencia y los
 * eventos se disparen correctamente.
 */

import { storage, StorageKeys, ensureSeeded } from '../services/storage.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { Bug } from '../models/Bug.js';
import { Developer } from '../models/Developer.js';

class Store extends EventTarget {
  constructor() {
    super();
    this.projects = [];
    this.tasks = [];
    this.bugs = [];
    this.developers = [];
    this.events = [];
    this.weeklyProductivity = [];
  }

  async init() {
    await ensureSeeded();
    this.projects = storage.get(StorageKeys.PROJECTS, []).map(Project.fromObject);
    this.tasks = storage.get(StorageKeys.TASKS, []).map(Task.fromObject);
    this.bugs = storage.get(StorageKeys.BUGS, []).map(Bug.fromObject);
    this.developers = storage.get(StorageKeys.DEVELOPERS, []).map(Developer.fromObject);
    this.events = storage.get(StorageKeys.EVENTS, []);
    this.weeklyProductivity = storage.get(StorageKeys.WEEKLY_PRODUCTIVITY, []);
    this.emit('store:ready');
  }

  // ---------- Helpers internos ----------

  emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  persist(key, list) {
    storage.set(key, list.map((item) => (typeof item.toJSON === 'function' ? item.toJSON() : item)));
  }

  // ---------- Proyectos ----------

  addProject(data) {
    const project = new Project(data);
    this.projects.push(project);
    this.persist(StorageKeys.PROJECTS, this.projects);
    this.emit('projects:changed', { type: 'add', item: project });
    return project;
  }

  updateProject(id, data) {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const updated = new Project({ ...this.projects[index].toJSON(), ...data, id });
    this.projects[index] = updated;
    this.persist(StorageKeys.PROJECTS, this.projects);
    this.emit('projects:changed', { type: 'update', item: updated });
    return updated;
  }

  removeProject(id) {
    this.projects = this.projects.filter((p) => p.id !== id);
    // Eliminar en cascada tareas y bugs asociados.
    this.tasks = this.tasks.filter((t) => t.projectId !== id);
    this.bugs = this.bugs.filter((b) => b.projectId !== id);
    this.persist(StorageKeys.PROJECTS, this.projects);
    this.persist(StorageKeys.TASKS, this.tasks);
    this.persist(StorageKeys.BUGS, this.bugs);
    this.emit('projects:changed', { type: 'remove', id });
    this.emit('tasks:changed', { type: 'cascade' });
    this.emit('bugs:changed', { type: 'cascade' });
  }

  getProjectById(id) {
    return this.projects.find((p) => p.id === id) || null;
  }

  // ---------- Tareas ----------

  addTask(data) {
    const task = new Task(data);
    this.tasks.push(task);
    this.persist(StorageKeys.TASKS, this.tasks);
    this.emit('tasks:changed', { type: 'add', item: task });
    return task;
  }

  updateTask(id, data) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const updated = new Task({ ...this.tasks[index].toJSON(), ...data, id });
    this.tasks[index] = updated;
    this.persist(StorageKeys.TASKS, this.tasks);
    this.emit('tasks:changed', { type: 'update', item: updated });
    return updated;
  }

  removeTask(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.persist(StorageKeys.TASKS, this.tasks);
    this.emit('tasks:changed', { type: 'remove', id });
  }

  getTaskById(id) {
    return this.tasks.find((t) => t.id === id) || null;
  }

  // ---------- Bugs ----------

  addBug(data) {
    if (data.status === 'Resuelto' && !data.resolvedDate) {
      const d = new Date();
      data.resolvedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const bug = new Bug(data);
    this.bugs.push(bug);
    this.persist(StorageKeys.BUGS, this.bugs);
    this.emit('bugs:changed', { type: 'add', item: bug });
    return bug;
  }

  updateBug(id, data) {
    const index = this.bugs.findIndex((b) => b.id === id);
    if (index === -1) return null;
    const existing = this.bugs[index];
    let resolvedDate = data.resolvedDate ?? existing.resolvedDate;
    if (data.status === 'Resuelto' && existing.status !== 'Resuelto') {
      const d = new Date();
      resolvedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else if (data.status && data.status !== 'Resuelto') {
      resolvedDate = null;
    }
    const updated = new Bug({ ...existing.toJSON(), ...data, resolvedDate, id });
    this.bugs[index] = updated;
    this.persist(StorageKeys.BUGS, this.bugs);
    this.emit('bugs:changed', { type: 'update', item: updated });
    return updated;
  }

  removeBug(id) {
    this.bugs = this.bugs.filter((b) => b.id !== id);
    this.persist(StorageKeys.BUGS, this.bugs);
    this.emit('bugs:changed', { type: 'remove', id });
  }

  getBugById(id) {
    return this.bugs.find((b) => b.id === id) || null;
  }

  // ---------- Desarrolladores ----------

  getDeveloperById(id) {
    return this.developers.find((d) => d.id === id) || null;
  }

  // ---------- Métricas derivadas ----------

  get activeProjectsCount() {
    return this.projects.filter((p) => p.isActive).length;
  }

  get openBugsCount() {
    return this.bugs.filter((b) => !b.isResolved).length;
  }

  get resolvedBugsCount() {
    return this.bugs.filter((b) => b.isResolved).length;
  }

  /** % de tareas completadas sobre el total. */
  get productivityRate() {
    if (this.tasks.length === 0) return 0;
    const completed = this.tasks.filter((t) => t.isCompleted).length;
    return Math.round((completed / this.tasks.length) * 100);
  }

  /** Tiempo promedio de resolución de bugs resueltos, en días (estimado a partir de la fecha registrada). */
  get avgResolutionDays() {
    const resolved = this.bugs.filter((b) => b.isResolved);
    if (resolved.length === 0) return 0;
    const total = resolved.reduce((sum, b) => sum + b.daysOpen, 0);
    return Math.round((total / resolved.length) * 10) / 10;
  }

  bugsByProject() {
    return this.projects.map((project) => ({
      project,
      count: this.bugs.filter((b) => b.projectId === project.id).length,
    }));
  }

  tasksByStatus() {
    const statuses = ['Pendiente', 'En progreso', 'En revisión', 'Completada'];
    return statuses.map((status) => ({
      status,
      count: this.tasks.filter((t) => t.status === status).length,
    }));
  }
}

export const store = new Store();

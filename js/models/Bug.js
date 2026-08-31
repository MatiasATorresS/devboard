/**
 * Bug.js
 * Modelo de un bug/incidencia registrada en un proyecto.
 */

import { PRIORITY_LEVELS } from './Project.js';

export const BUG_STATUS = ['Abierto', 'En progreso', 'Resuelto'];

export class Bug {
  constructor({
    id = null,
    description,
    priority = 'Media',
    status = 'Abierto',
    date = null,
    projectId,
    resolvedDate = null,
  }) {
    if (!description || !description.trim()) throw new Error('El bug necesita una descripción.');
    if (!projectId) throw new Error('El bug necesita un proyecto asociado.');

    this.id = id ?? Bug.generateId();
    this.description = description.trim();
    this.priority = PRIORITY_LEVELS.includes(priority) ? priority : 'Media';
    this.status = BUG_STATUS.includes(status) ? status : 'Abierto';
    
    const d = new Date();
    const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.date = date ?? localToday;
    this.projectId = projectId;
    this.resolvedDate = resolvedDate;
  }

  static generateId() {
    return `bug-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  static fromObject(obj) {
    return new Bug(obj);
  }

  get isResolved() {
    return this.status === 'Resuelto';
  }

  get isCritical() {
    return this.priority === 'Crítica';
  }

  /** Días abiertos desde su creación hasta hoy o hasta que fue resuelto. */
  get daysOpen() {
    const created = new Date(this.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = this.resolvedDate ? new Date(this.resolvedDate + 'T00:00:00') : today;
    return Math.max(0, Math.round((end - created) / (1000 * 60 * 60 * 24)));
  }

  toJSON() {
    return {
      id: this.id,
      description: this.description,
      priority: this.priority,
      status: this.status,
      date: this.date,
      projectId: this.projectId,
      resolvedDate: this.resolvedDate,
    };
  }
}

/**
 * Task.js
 * Modelo de una tarea asociada a un proyecto y un responsable.
 */

import { PRIORITY_LEVELS } from './Project.js';

export const TASK_STATUS = ['Pendiente', 'En progreso', 'En revisión', 'Completada'];

export class Task {
  constructor({
    id = null,
    name,
    projectId,
    assigneeId,
    status = 'Pendiente',
    priority = 'Media',
    estimatedHours = 0,
    actualHours = 0,
    dueDate = null,
  }) {
    if (!name || !name.trim()) throw new Error('La tarea necesita un nombre.');
    if (!projectId) throw new Error('La tarea necesita un proyecto asociado.');

    this.id = id ?? Task.generateId();
    this.name = name.trim();
    this.projectId = projectId;
    this.assigneeId = assigneeId || null;
    this.status = TASK_STATUS.includes(status) ? status : 'Pendiente';
    this.priority = PRIORITY_LEVELS.includes(priority) ? priority : 'Media';
    this.estimatedHours = Number(estimatedHours) || 0;
    this.actualHours = Number(actualHours) || 0;
    this.dueDate = dueDate;
  }

  static generateId() {
    return `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  static fromObject(obj) {
    return new Task(obj);
  }

  get isCompleted() {
    return this.status === 'Completada';
  }

  /** Desviación entre horas reales y estimadas. Positivo = sobre estimación. */
  get hoursVariance() {
    return this.actualHours - this.estimatedHours;
  }

  get isOverdue() {
    if (!this.dueDate || this.isCompleted) return false;
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return this.dueDate < todayStr;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      projectId: this.projectId,
      assigneeId: this.assigneeId,
      status: this.status,
      priority: this.priority,
      estimatedHours: this.estimatedHours,
      actualHours: this.actualHours,
      dueDate: this.dueDate,
    };
  }
}

/**
 * Project.js
 * Modelo de un proyecto de software.
 */

export const PROJECT_STATUS = ['Planificación', 'En progreso', 'Revisión', 'Completado', 'Pausado'];
export const PRIORITY_LEVELS = ['Baja', 'Media', 'Alta', 'Crítica'];

export class Project {
  constructor({
    id = null,
    name,
    client,
    startDate,
    endDate,
    status = 'Planificación',
    priority = 'Media',
    color = '#5B8DEF',
    progress = 0,
  }) {
    if (!name || !name.trim()) throw new Error('El proyecto necesita un nombre.');
    if (!client || !client.trim()) throw new Error('El proyecto necesita un cliente.');

    this.id = id ?? Project.generateId();
    this.name = name.trim();
    this.client = client.trim();
    this.startDate = startDate;
    this.endDate = endDate;
    this.status = PROJECT_STATUS.includes(status) ? status : 'Planificación';
    this.priority = PRIORITY_LEVELS.includes(priority) ? priority : 'Media';
    this.color = color;
    this.progress = Math.min(100, Math.max(0, Number(progress) || 0));
  }

  static generateId() {
    return `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  static fromObject(obj) {
    return new Project(obj);
  }

  /** Días totales entre inicio y término. */
  get durationDays() {
    if (!this.startDate || !this.endDate) return 0;
    const start = new Date(this.startDate + 'T00:00:00');
    const end = new Date(this.endDate + 'T00:00:00');
    return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  }

  /** Días restantes hasta la fecha de término, desde hoy. */
  get daysRemaining() {
    if (!this.endDate) return 0;
    const end = new Date(this.endDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((end - today) / (1000 * 60 * 60 * 24));
  }

  get isOverdue() {
    return this.status !== 'Completado' && this.daysRemaining < 0;
  }

  get isActive() {
    return this.status === 'En progreso' || this.status === 'Revisión';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      client: this.client,
      startDate: this.startDate,
      endDate: this.endDate,
      status: this.status,
      priority: this.priority,
      color: this.color,
      progress: this.progress,
    };
  }
}

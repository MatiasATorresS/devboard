/**
 * Developer.js
 * Modelo de un desarrollador del equipo.
 */

export class Developer {
  constructor({ id = null, name, role = 'Developer', avatarColor = '#5B8DEF', productivity = 0 }) {
    if (!name || !name.trim()) throw new Error('El desarrollador necesita un nombre.');

    this.id = id ?? Developer.generateId();
    this.name = name.trim();
    this.role = role;
    this.avatarColor = avatarColor;
    this.productivity = Math.min(100, Math.max(0, Number(productivity) || 0));
  }

  static generateId() {
    return `dev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  static fromObject(obj) {
    return new Developer(obj);
  }

  /** Iniciales para mostrar en avatar cuando no hay imagen. */
  get initials() {
    return this.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      avatarColor: this.avatarColor,
      productivity: this.productivity,
    };
  }
}

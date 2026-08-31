/**
 * storage.js
 * Capa de persistencia sobre localStorage.
 * Toda la app lee/escribe datos a través de este módulo: nadie
 * más debe tocar `localStorage` directamente.
 */

const STORAGE_PREFIX = 'devboard';
const STORAGE_VERSION = 'v1';

function buildKey(key) {
  return `${STORAGE_PREFIX}:${STORAGE_VERSION}:${key}`;
}

export const StorageKeys = {
  PROJECTS: 'projects',
  TASKS: 'tasks',
  BUGS: 'bugs',
  DEVELOPERS: 'developers',
  EVENTS: 'events',
  WEEKLY_PRODUCTIVITY: 'weeklyProductivity',
  SETTINGS: 'settings',
  PROFILE: 'profile',
  SEEDED: 'seeded',
};

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(buildKey(key));
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.error(`[storage] Error leyendo "${key}":`, err);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(buildKey(key), JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`[storage] Error escribiendo "${key}":`, err);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(buildKey(key));
  },

  clearAll() {
    Object.values(StorageKeys).forEach((key) => this.remove(key));
  },
};

/**
 * Carga los datos semilla desde /data/seed.json solo la primera vez
 * que se abre la app (o si se borró el localStorage manualmente).
 */
export async function ensureSeeded() {
  const alreadySeeded = storage.get(StorageKeys.SEEDED, false);
  if (alreadySeeded) return;

  try {
    const res = await fetch('./data/seed.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const seed = await res.json();

    storage.set(StorageKeys.PROJECTS, seed.projects || []);
    storage.set(StorageKeys.TASKS, seed.tasks || []);
    storage.set(StorageKeys.BUGS, seed.bugs || []);
    storage.set(StorageKeys.DEVELOPERS, seed.developers || []);
    storage.set(StorageKeys.EVENTS, seed.events || []);
    storage.set(StorageKeys.WEEKLY_PRODUCTIVITY, seed.weeklyProductivity || []);
    storage.set(StorageKeys.SEEDED, true);
  } catch (err) {
    console.error('[storage] No se pudo cargar seed.json:', err);
  }
}

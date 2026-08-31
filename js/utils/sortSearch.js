/**
 * sortSearch.js
 * Funciones puras de ordenamiento y búsqueda reutilizadas por las
 * vistas de Proyectos, Tareas y Bugs.
 */

const PRIORITY_WEIGHT = { Baja: 1, Media: 2, Alta: 3, Crítica: 4 };

/**
 * Ordena un array de objetos por un campo dado.
 * @param {Array} list
 * @param {string} field
 * @param {'asc'|'desc'} direction
 */
export function sortByField(list, field, direction = 'asc') {
  const sorted = [...list].sort((a, b) => {
    let valA = a[field];
    let valB = b[field];

    // Prioridad tiene un orden semántico propio, no alfabético.
    if (field === 'priority') {
      valA = PRIORITY_WEIGHT[valA] ?? 0;
      valB = PRIORITY_WEIGHT[valB] ?? 0;
    }

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}

/**
 * Búsqueda simple por substring, insensible a mayúsculas/acentos, sobre
 * uno o varios campos de texto de cada item.
 */
export function searchByFields(list, query, fields) {
  if (!query || !query.trim()) return list;
  const normalized = normalize(query);
  return list.filter((item) =>
    fields.some((field) => normalize(String(item[field] ?? '')).includes(normalized))
  );
}

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Búsqueda global usada por el command palette (CTRL+K). */
export function globalSearch({ projects, tasks, bugs, developers }, query) {
  const normalized = normalize(query || '');
  if (!normalized) return [];

  const results = [];

  projects.forEach((p) => {
    if (normalize(p.name).includes(normalized) || normalize(p.client).includes(normalized)) {
      results.push({ type: 'Proyecto', id: p.id, label: p.name, sublabel: p.client });
    }
  });

  developers.forEach((d) => {
    if (normalize(d.name).includes(normalized) || normalize(d.role).includes(normalized)) {
      results.push({ type: 'Desarrollador', id: d.id, label: d.name, sublabel: d.role });
    }
  });

  bugs.forEach((b) => {
    if (normalize(b.description).includes(normalized)) {
      results.push({ type: 'Bug', id: b.id, label: b.description, sublabel: b.status });
    }
  });

  tasks.forEach((t) => {
    if (normalize(t.name).includes(normalized)) {
      results.push({ type: 'Tarea', id: t.id, label: t.name, sublabel: t.status });
    }
  });

  return results.slice(0, 20);
}

/**
 * skeleton.js
 * Pantallas skeleton mostradas mientras se cargan los datos iniciales.
 */

export function renderMetricsSkeleton(container) {
  if (!container) return;
  container.innerHTML = Array.from({ length: 6 })
    .map(() => '<div class="skeleton skeleton-card"></div>')
    .join('');
}

export function renderTableSkeleton(tbody, columns = 6, rows = 5) {
  if (!tbody) return;
  tbody.innerHTML = Array.from({ length: rows })
    .map(() => `<tr>${Array.from({ length: columns }).map(() => `<td><div class="skeleton skeleton-row"></div></td>`).join('')}</tr>`)
    .join('');
}

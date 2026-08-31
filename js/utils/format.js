/**
 * format.js
 * Utilidades de formato: fechas, horas, porcentajes.
 */

const MONTHS_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day} ${MONTHS_ES[month]} ${year}`;
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  const month = parts[1];
  const day = parts[2];
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}`;
}

export function formatHours(hours) {
  return `${Number(hours).toLocaleString('es-CL')} h`;
}

export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

export function relativeDays(dateStr) {
  if (!dateStr) return '';
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  if (diff > 1) return `En ${diff} días`;
  return `Hace ${Math.abs(diff)} días`;
}

export function isoToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

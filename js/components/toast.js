/**
 * toast.js
 * Sistema de notificaciones (toasts) tipo "Proyecto creado", "Bug agregado", etc.
 */

import { createEl } from '../utils/dom.js';

const ICONS = {
  success: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6 11.5L13 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  error: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 7V11.5M8 4.8V5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

let container = null;

function getContainer() {
  if (!container) {
    container = document.getElementById('toast-container');
  }
  return container;
}

export function showToast(message, { type = 'success', duration = 3200 } = {}) {
  const root = getContainer();
  if (!root) return;

  const toast = createEl('div', { className: `toast toast--${type}` });
  const icon = createEl('span', { className: 'toast__icon', html: ICONS[type] || ICONS.info });
  const text = createEl('span', { className: 'toast__text', text: message });

  toast.append(icon, text);
  root.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  const remove = () => {
    toast.classList.remove('toast--visible');
    toast.classList.add('toast--leaving');
    setTimeout(() => toast.remove(), 220);
  };

  const timer = setTimeout(remove, duration);
  toast.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });
}

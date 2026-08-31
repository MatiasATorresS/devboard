/**
 * dom.js
 * Helpers pequeños de manipulación del DOM y control de eventos.
 */

export function debounce(fn, delay = 250) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function createEl(tag, { className, attrs = {}, html, text } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  if (html !== undefined) el.innerHTML = html;
  if (text !== undefined) el.textContent = text;
  return el;
}

/** Escapa texto para insertarlo seguro dentro de innerHTML. */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

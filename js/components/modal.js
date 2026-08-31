/**
 * modal.js
 * Modal genérico reutilizable. Cada vista (proyectos, tareas, bugs)
 * le pasa el título, el HTML del cuerpo y los botones del footer.
 */

import { qs } from '../utils/dom.js';

let overlay, modal, titleEl, bodyEl, footerEl, closeBtn;
let onCloseCallback = null;

export function initModal() {
  overlay = qs('#modal-overlay');
  modal = qs('#modal');
  titleEl = qs('#modal-title');
  bodyEl = qs('#modal-body');
  footerEl = qs('#modal-footer');
  closeBtn = qs('#modal-close-btn');

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
  });
}

export function openModal({ title, bodyHtml, footerHtml, onMount, onClose }) {
  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;
  footerEl.innerHTML = footerHtml || '';
  onCloseCallback = onClose || null;

  overlay.classList.add('is-open');

  if (typeof onMount === 'function') {
    // Esperar un frame para que el DOM del modal ya esté insertado.
    requestAnimationFrame(() => onMount(bodyEl, footerEl));
  }

  const firstInput = bodyEl.querySelector('input, select, textarea');
  if (firstInput) setTimeout(() => firstInput.focus(), 80);
}

export function closeModal() {
  overlay.classList.remove('is-open');
  if (typeof onCloseCallback === 'function') onCloseCallback();
}

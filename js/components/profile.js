/**
 * profile.js
 * Tarjeta de perfil del usuario actual: avatar, nombre, cargo y
 * productividad. Usa el primer desarrollador del store como "yo".
 */

import { store } from '../services/store.js';
import { qs, escapeHtml } from '../utils/dom.js';

export function renderProfile() {
  const card = qs('#profile-card');
  const topbarAvatar = qs('#topbar-avatar');
  if (!card) return;

  const me = store.developers[0];
  if (!me) {
    card.innerHTML = `<div class="empty-state">No hay datos de perfil disponibles.</div>`;
    return;
  }

  card.innerHTML = `
    <div class="profile-card__avatar" style="background:${me.avatarColor};">${me.initials}</div>
    <div class="profile-card__name">${escapeHtml(me.name)}</div>
    <div class="profile-card__role">${escapeHtml(me.role)}</div>
    <div class="profile-card__stat">
      <div class="profile-card__stat-value numeric">${me.productivity}%</div>
      <div class="profile-card__stat-label">Productividad</div>
    </div>
  `;

  if (topbarAvatar) {
    topbarAvatar.textContent = me.initials;
    topbarAvatar.style.background = me.avatarColor;
  }
}

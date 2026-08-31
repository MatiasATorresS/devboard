/**
 * sparkline.js
 * Genera un mini gráfico de línea en SVG para acompañar cada métrica
 * del dashboard, al estilo Stripe/Vercel.
 */

export function renderSparkline(values, color = '#5B8DEF') {
  if (!values || values.length < 2) {
    return '<svg viewBox="0 0 100 32"></svg>';
  }

  const width = 100;
  const height = 32;
  const padding = 3;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return [x, y];
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1][0].toFixed(1)},${height} L${points[0][0].toFixed(1)},${height} Z`;

  const gradientId = `spark-grad-${Math.random().toString(36).slice(2, 8)}`;

  return `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" width="100%" height="100%">
      <defs>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.28" />
          <stop offset="100%" stop-color="${color}" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#${gradientId})" stroke="none" />
      <path d="${linePath}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
}

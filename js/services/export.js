/**
 * export.js
 * Exporta listas de datos a archivos CSV o JSON descargables.
 */

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportToJSON(data, filename = 'devboard-export.json') {
  const content = JSON.stringify(data, null, 2);
  downloadFile(content, filename, 'application/json');
}

export function exportToCSV(rows, filename = 'devboard-export.csv') {
  if (!rows || rows.length === 0) {
    downloadFile('', filename, 'text/csv');
    return;
  }

  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(',')),
  ];

  // BOM para que Excel reconozca UTF-8 (tildes, ñ) correctamente.
  downloadFile('\uFEFF' + lines.join('\n'), filename, 'text/csv;charset=utf-8');
}

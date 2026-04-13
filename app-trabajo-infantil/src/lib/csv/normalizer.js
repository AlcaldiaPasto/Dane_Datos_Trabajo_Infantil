const NULL_MARKERS = new Set(["", "NA", "N/A", "NULL", "NULO", "NONE", "SIN INFORMACION", "SIN INFORMACION."]);

export function normalizeColumnName(columnName) {
  return String(columnName || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();
}

export function normalizeHeaders(headers) {
  return headers.map(normalizeColumnName);
}

export function normalizeCellValue(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  const marker = normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  return NULL_MARKERS.has(marker) ? null : normalized;
}

export function normalizeRow(row) {
  return Object.entries(row || {}).reduce((accumulator, [key, value]) => {
    accumulator[normalizeColumnName(key)] = normalizeCellValue(value);
    return accumulator;
  }, {});
}

export function normalizeRows(rows) {
  return rows.map(normalizeRow);
}

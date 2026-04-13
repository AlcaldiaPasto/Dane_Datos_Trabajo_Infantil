export function normalizeColumnName(columnName) {
  return String(columnName || "").trim().replace(/\s+/g, "_").toUpperCase();
}
export function normalizeHeaders(headers) { return headers.map(normalizeColumnName); }

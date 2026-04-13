import { REQUIRED_TECHNICAL_COLUMNS, SUGGESTED_ANALYTICAL_COLUMNS } from "../constants/required-columns.js";
import { normalizeColumnName } from "./normalizer.js";

const NUMERIC_RULES = [
  { column: "P6040", label: "edad", min: 5, max: 17 },
  { column: "P3271", label: "sexo", allowed: ["1", "2"] },
  { column: "P6160", label: "asistencia escolar", allowed: ["1", "2", "9"] },
  { column: "P6170", label: "estudia actualmente", allowed: ["1", "2", "9"] },
  { column: "P400", label: "trabajo economico P400", allowed: ["1", "2", "3", "9"] },
  { column: "P401", label: "trabajo economico P401", allowed: ["1", "2", "3", "9"] },
  { column: "P402", label: "trabajo economico P402", allowed: ["1", "2", "3", "9"] },
  { column: "P403", label: "trabajo economico P403", allowed: ["1", "2", "3", "9"] },
];

function normalizeHeaders(headers) {
  return headers.map((header) => normalizeColumnName(header));
}

function findDuplicateHeaders(headers) {
  const counts = headers.reduce((accumulator, header) => {
    accumulator[header] = (accumulator[header] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .filter(([, count]) => count > 1)
    .map(([header]) => header);
}

function buildHeaderLookup(headers) {
  return headers.reduce((accumulator, header) => {
    accumulator[normalizeColumnName(header)] = header;
    return accumulator;
  }, {});
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function buildRowIssues(rows, headers, normalizedHeaders, limit = 50) {
  const issues = [];
  const headerLookup = buildHeaderLookup(headers);

  for (const rule of NUMERIC_RULES) {
    if (!normalizedHeaders.includes(rule.column)) continue;
    const sourceColumn = headerLookup[rule.column] || rule.column;

    rows.forEach((row, index) => {
      const value = row[sourceColumn];
      if (!hasValue(value)) return;

      const rawValue = String(value).trim();

      if (rule.allowed && !rule.allowed.includes(rawValue)) {
        issues.push({
          severity: "warning",
          row: index + 2,
          column: rule.column,
          message: `Fila ${index + 2}, columna ${rule.column}: valor '${rawValue}' fuera del catalogo esperado para ${rule.label}.`,
        });
      }

      if (Number.isFinite(rule.min) || Number.isFinite(rule.max)) {
        const numeric = Number(rawValue);
        if (!Number.isFinite(numeric) || numeric < rule.min || numeric > rule.max) {
          issues.push({
            severity: "warning",
            row: index + 2,
            column: rule.column,
            message: `Fila ${index + 2}, columna ${rule.column}: valor '${rawValue}' fuera del rango esperado ${rule.min}-${rule.max} para ${rule.label}.`,
          });
        }
      }
    });
  }

  return issues.slice(0, limit);
}

export function validateDatasetStructure(headers, rows = []) {
  const normalizedHeaders = normalizeHeaders(headers);
  const missingColumns = REQUIRED_TECHNICAL_COLUMNS.filter((column) => !normalizedHeaders.includes(column));
  const missingSuggestedColumns = SUGGESTED_ANALYTICAL_COLUMNS.filter(
    (column) => !normalizedHeaders.includes(column)
  );
  const duplicateHeaders = findDuplicateHeaders(normalizedHeaders);
  const rowIssues = buildRowIssues(rows, headers, normalizedHeaders);
  const warnings = [
    ...missingSuggestedColumns.map((column) => `Columna analitica sugerida ausente: ${column}.`),
    ...duplicateHeaders.map((column) => `Encabezado duplicado detectado: ${column}.`),
    ...rowIssues.map((issue) => issue.message),
  ];

  return {
    isValid: headers.length > 0 && missingColumns.length === 0,
    missingColumns,
    missingSuggestedColumns,
    duplicateHeaders,
    rowIssues,
    warnings,
    normalizedHeaders,
  };
}

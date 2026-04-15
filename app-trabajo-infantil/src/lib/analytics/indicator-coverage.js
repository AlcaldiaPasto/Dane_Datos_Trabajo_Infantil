import { normalizeColumnName } from "../csv/normalizer.js";

const ECONOMIC_WORK_COLUMNS = ["P400", "P401", "P402", "P403"];
const STUDIES_COLUMNS = ["P6160", "P6170"];
const AGE_COLUMNS = ["P6040"];
const SEX_COLUMNS = ["P3271"];

function buildDomesticHourColumns() {
  const columns = [];

  for (let question = 3131; question <= 3136; question += 1) {
    for (let section = 1; section <= 3; section += 1) {
      const baseKey = `P${question}S${section}`;
      columns.push(baseKey, `${baseKey}A1`, `${baseKey}A2`);
    }
  }

  return columns;
}

const DOMESTIC_HOUR_COLUMNS = buildDomesticHourColumns();

function toHeaderSet(headers = []) {
  return new Set(headers.map((header) => normalizeColumnName(header)));
}

function hasAnyColumn(headerSet, candidates) {
  return candidates.some((column) => headerSet.has(column));
}

function readRowValue(row, column) {
  if (!row || typeof row !== "object") return null;
  const normalizedColumn = normalizeColumnName(column);

  if (Object.prototype.hasOwnProperty.call(row, normalizedColumn)) {
    return row[normalizedColumn];
  }
  if (Object.prototype.hasOwnProperty.call(row, column)) {
    return row[column];
  }

  const fallbackKey = Object.keys(row).find((key) => normalizeColumnName(key) === normalizedColumn);
  return fallbackKey ? row[fallbackKey] : null;
}

function hasNonEmptyValue(rows, candidates) {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.some((row) =>
    candidates.some((column) => {
      const value = readRowValue(row, column);
      return value !== null && value !== undefined && String(value).trim() !== "";
    })
  );
}

function hasAgeCoverage(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.some((row) => {
    const value = Number(readRowValue(row, "P6040"));
    return Number.isFinite(value) && value >= 5 && value <= 17;
  });
}

function hasSexCoverage(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.some((row) => {
    const value = String(readRowValue(row, "P3271") ?? "").trim();
    return value === "1" || value === "2";
  });
}

function hasDomesticCoverage(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return false;

  for (let question = 3131; question <= 3136; question += 1) {
    for (let section = 1; section <= 3; section += 1) {
      const baseKey = `P${question}S${section}`;
      const daysKey = `${baseKey}A1`;
      const hoursKey = `${baseKey}A2`;

      const hasCoverage = rows.some((row) => {
        const baseRaw = readRowValue(row, baseKey);
        const daysRaw = readRowValue(row, daysKey);
        const hoursRaw = readRowValue(row, hoursKey);
        const base = String(baseRaw ?? "").trim();
        const days = Number(daysRaw);
        const hours = Number(hoursRaw);

        if (base === "1" || base === "2") return true;
        if (Number.isFinite(days) && days > 0) return true;
        if (Number.isFinite(hours) && hours > 0) return true;

        return false;
      });

      if (hasCoverage) return true;
    }
  }

  return false;
}

export function detectIndicatorCoverage(headers = [], rows = []) {
  const headerSet = toHeaderSet(headers);
  const hasRows = Array.isArray(rows) && rows.length > 0;

  const ageFromHeaders = hasAnyColumn(headerSet, AGE_COLUMNS);
  const sexFromHeaders = hasAnyColumn(headerSet, SEX_COLUMNS);
  const studiesFromHeaders = hasAnyColumn(headerSet, STUDIES_COLUMNS);
  const economicFromHeaders = hasAnyColumn(headerSet, ECONOMIC_WORK_COLUMNS);
  const domesticFromHeaders = hasAnyColumn(headerSet, DOMESTIC_HOUR_COLUMNS);

  const age = hasRows ? ageFromHeaders && hasAgeCoverage(rows) : ageFromHeaders;
  const sex = hasRows ? sexFromHeaders && hasSexCoverage(rows) : sexFromHeaders;
  const studies = hasRows ? studiesFromHeaders && hasNonEmptyValue(rows, STUDIES_COLUMNS) : studiesFromHeaders;
  const economicWork = hasRows
    ? economicFromHeaders && hasNonEmptyValue(rows, ECONOMIC_WORK_COLUMNS)
    : economicFromHeaders;
  const domesticHours = hasRows ? domesticFromHeaders && hasDomesticCoverage(rows) : domesticFromHeaders;
  const intensiveChores = domesticHours;
  const expandedChildLabor = economicWork && intensiveChores;

  return {
    totalChildren: true,
    age,
    sex,
    studies,
    economicWork,
    domesticHours,
    intensiveChores,
    expandedChildLabor,
    situation: studies && economicWork,
    riskFinal: expandedChildLabor,
  };
}

export function withCoverageFallback(dataset = {}) {
  if (dataset.indicatorCoverage) {
    return dataset.indicatorCoverage;
  }

  const headers = [...(dataset.columns || []), ...(dataset.cleanedColumns || [])];
  const rows = Array.isArray(dataset.rawRows) && dataset.rawRows.length ? dataset.rawRows : [];
  return detectIndicatorCoverage(headers, rows);
}

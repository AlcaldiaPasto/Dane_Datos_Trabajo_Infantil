import { normalizeColumnName } from "../csv/normalizer.js";

const ECONOMIC_WORK_COLUMNS = ["P400", "P401", "P402", "P403"];
const STUDIES_COLUMNS = ["P6160", "P6170", "P400"];
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

export function detectIndicatorCoverage(headers = []) {
  const headerSet = toHeaderSet(headers);
  const age = hasAnyColumn(headerSet, AGE_COLUMNS);
  const sex = hasAnyColumn(headerSet, SEX_COLUMNS);
  const studies = hasAnyColumn(headerSet, STUDIES_COLUMNS);
  const economicWork = hasAnyColumn(headerSet, ECONOMIC_WORK_COLUMNS);
  const domesticHours = hasAnyColumn(headerSet, DOMESTIC_HOUR_COLUMNS);
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
  return detectIndicatorCoverage(headers);
}

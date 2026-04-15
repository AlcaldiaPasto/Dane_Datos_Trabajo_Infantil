import { detectIndicatorCoverage } from "@/lib/analytics/indicator-coverage";

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (["true", "1", "si", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return null;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveCoverage(dataset) {
  const headers = [...(dataset?.columns || []), ...(dataset?.cleanedColumns || [])];
  const rows = Array.isArray(dataset?.rawRows) && dataset.rawRows.length ? dataset.rawRows : [];
  const hasRawRows = rows.length > 0;
  const inferredCoverage = detectIndicatorCoverage(headers, rows);

  if (!dataset?.indicatorCoverage || typeof dataset.indicatorCoverage !== "object") {
    return inferredCoverage;
  }

  if (!hasRawRows) {
    return dataset.indicatorCoverage;
  }

  const merged = { ...dataset.indicatorCoverage };
  Object.keys(inferredCoverage).forEach((key) => {
    const hasStored = typeof merged[key] === "boolean";
    const hasInferred = typeof inferredCoverage[key] === "boolean";

    if (hasStored && hasInferred) {
      merged[key] = merged[key] && inferredCoverage[key];
      return;
    }

    if (hasInferred) {
      merged[key] = inferredCoverage[key];
    }
  });

  return merged;
}

function normalizeRecordFromCleanRow(dataset, coverage, row, rowIndex) {
  const recordYear = toNumber(row.anio) ?? toNumber(dataset.detectedYear);

  return {
    id: `${dataset.id}-${row.DIRECTORIO || "row"}-${row.ORDEN || rowIndex}`,
    datasetId: dataset.id,
    year: recordYear,
    sex: coverage.sex ? row.sexo ?? null : null,
    age: coverage.age ? toNumber(row.edad) : null,
    works: coverage.economicWork ? toBoolean(row.trabaja) : null,
    studies: coverage.studies ? toBoolean(row.estudia) : null,
    economicWork: coverage.economicWork ? toBoolean(row.trabajoEconomico) : null,
    intensiveChores: coverage.intensiveChores ? toBoolean(row.oficiosIntensivos) : null,
    expandedChildLabor: coverage.expandedChildLabor ? toBoolean(row.trabajoInfantilAmpliado) : null,
    domesticHours: coverage.domesticHours ? toNumber(row.horasOficiosHogar) : null,
    domesticCategory: coverage.domesticHours ? row.clasificacionCargaDomestica ?? null : null,
    situation: coverage.situation ? row.situacionPrincipal ?? null : null,
    riskFinal: coverage.riskFinal ? row.riesgoFinal ?? null : null,
  };
}

export function buildDashboardRecordsFromLocalDatasets(datasets) {
  if (!Array.isArray(datasets) || datasets.length === 0) return [];

  const records = [];
  datasets.forEach((dataset) => {
    if (dataset.status !== "clean") return;
    const coverage = resolveCoverage(dataset);
    const rows = Array.isArray(dataset.cleanedRows) ? dataset.cleanedRows : [];
    rows.forEach((row, index) => {
      records.push(normalizeRecordFromCleanRow(dataset, coverage, row, index));
    });
  });

  return records;
}

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

function normalizeRecordFromCleanRow(dataset, row, rowIndex) {
  const recordYear = toNumber(row.anio) ?? toNumber(dataset.detectedYear);
  return {
    id: `${dataset.id}-${row.DIRECTORIO || "row"}-${row.ORDEN || rowIndex}`,
    datasetId: dataset.id,
    year: recordYear,
    sex: row.sexo ?? null,
    age: toNumber(row.edad),
    works: toBoolean(row.trabaja),
    studies: toBoolean(row.estudia),
    economicWork: toBoolean(row.trabajoEconomico),
    intensiveChores: toBoolean(row.oficiosIntensivos),
    expandedChildLabor: toBoolean(row.trabajoInfantilAmpliado),
    domesticHours: toNumber(row.horasOficiosHogar),
    domesticCategory: row.clasificacionCargaDomestica ?? null,
    situation: row.situacionPrincipal ?? null,
    riskFinal: row.riesgoFinal ?? null,
  };
}

export function buildDashboardRecordsFromLocalDatasets(datasets) {
  if (!Array.isArray(datasets) || datasets.length === 0) return [];

  const records = [];
  datasets.forEach((dataset) => {
    if (dataset.status !== "clean") return;
    const rows = Array.isArray(dataset.cleanedRows) ? dataset.cleanedRows : [];
    rows.forEach((row, index) => {
      records.push(normalizeRecordFromCleanRow(dataset, row, index));
    });
  });

  return records;
}


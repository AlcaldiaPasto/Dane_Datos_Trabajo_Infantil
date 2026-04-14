const PASTO_AREA_CODE = "52";
const PASTO_DIVIPOLA_CODE = "52001";

const AREA_COLUMNS = ["AREA", "COD_AREA", "CODIGO_AREA"];

const MUNICIPALITY_CODE_COLUMNS = [
  "DIVIPOLA",
  "COD_DANE",
  "CODIGO_DANE",
  "COD_MUNICIPIO",
  "CODIGO_MUNICIPIO",
  "COD_MPIO",
  "MPIO",
  "MUNICIPIO_COD",
  "DPTO_MPIO",
];

const MUNICIPALITY_NAME_COLUMNS = [
  "MUNICIPIO",
  "NOMBRE_MUNICIPIO",
  "NOM_MUNICIPIO",
  "NOM_MPIO",
  "CIUDAD",
  "NOMBRE_CIUDAD",
  "AREA_METROPOLITANA",
  "NOMBRE_AREA",
];

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function normalizeCode(value) {
  return normalizeText(value).replace(/[^\d]/g, "");
}

function collectHeaders(headers, rows) {
  const headerSet = new Set(headers.map((header) => String(header || "")));

  for (const row of rows.slice(0, 20)) {
    for (const key of Object.keys(row || {})) {
      headerSet.add(key);
    }
  }

  return [...headerSet];
}

function findColumn(headers, candidates) {
  const normalizedCandidates = new Set(candidates.map(normalizeText));
  return headers.find((header) => normalizedCandidates.has(normalizeText(header))) || null;
}

function buildResult(rows, column, method, keptRows, rule) {
  return {
    rows: keptRows,
    summary: {
      applied: true,
      city: "Pasto",
      column,
      method,
      rule,
      sourceRows: rows.length,
      keptRows: keptRows.length,
      removedRows: Math.max(rows.length - keptRows.length, 0),
    },
    issues: keptRows.length
      ? []
      : [`El filtro territorial de Pasto no encontro registros con la regla ${rule}.`],
  };
}

function matchPastoArea(row, column) {
  return normalizeCode(row[column]) === PASTO_AREA_CODE;
}

function matchPastoMunicipalityCode(row, column) {
  const value = normalizeCode(row[column]);
  return value === PASTO_DIVIPOLA_CODE || value === "001";
}

function matchPastoMunicipalityName(row, column) {
  const value = normalizeText(row[column]);
  return value === "PASTO" || value === "SAN JUAN DE PASTO" || value.includes("PASTO");
}

export function filterRowsForPasto(rows, headers = []) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const availableHeaders = collectHeaders(Array.isArray(headers) ? headers : [], safeRows);

  const municipalityNameColumn = findColumn(availableHeaders, MUNICIPALITY_NAME_COLUMNS);
  if (municipalityNameColumn) {
    const keptRows = safeRows.filter((row) => matchPastoMunicipalityName(row, municipalityNameColumn));
    if (!keptRows.length) {
      const rowsByCode = safeRows.filter((row) => matchPastoMunicipalityCode(row, municipalityNameColumn));
      if (rowsByCode.length) {
        return buildResult(
          safeRows,
          municipalityNameColumn,
          "municipality_code",
          rowsByCode,
          `${municipalityNameColumn} = ${PASTO_DIVIPOLA_CODE}`
        );
      }
    }

    return buildResult(
      safeRows,
      municipalityNameColumn,
      "municipality_name",
      keptRows,
      `${municipalityNameColumn} contiene Pasto`
    );
  }

  const municipalityCodeColumn = findColumn(availableHeaders, MUNICIPALITY_CODE_COLUMNS);
  if (municipalityCodeColumn) {
    const keptRows = safeRows.filter((row) => matchPastoMunicipalityCode(row, municipalityCodeColumn));
    return buildResult(
      safeRows,
      municipalityCodeColumn,
      "municipality_code",
      keptRows,
      `${municipalityCodeColumn} = ${PASTO_DIVIPOLA_CODE}`
    );
  }

  const areaColumn = findColumn(availableHeaders, AREA_COLUMNS);
  if (areaColumn) {
    const keptRows = safeRows.filter((row) => matchPastoArea(row, areaColumn));
    return buildResult(safeRows, areaColumn, "dane_area_code", keptRows, `${areaColumn} = ${PASTO_AREA_CODE}`);
  }

  return {
    rows: safeRows,
    summary: {
      applied: false,
      city: "Pasto",
      column: null,
      method: "not_available",
      rule: "Sin columna geografica reconocida",
      sourceRows: safeRows.length,
      keptRows: safeRows.length,
      removedRows: 0,
    },
    issues: [
      "No se encontro una columna geografica reconocida para filtrar Pasto; se conservaron las filas originales.",
    ],
  };
}

export function buildPastoFilterRule(summary) {
  if (!summary?.applied) {
    return "Filtro territorial Pasto: no aplicado por falta de columna geografica reconocida.";
  }

  return `Filtro territorial Pasto aplicado: ${summary.rule}. Filas conservadas: ${summary.keptRows} de ${summary.sourceRows}.`;
}

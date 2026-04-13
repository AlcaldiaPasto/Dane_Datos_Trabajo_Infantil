import { deriveDashboardRecord } from "@/lib/analytics/dashboard-calculations";
import { normalizeRows } from "@/lib/csv/normalizer";

const DERIVED_COLUMNS = [
  "anio",
  "sexo",
  "edad",
  "estudia",
  "trabaja",
  "trabajoEconomico",
  "oficiosIntensivos",
  "trabajoInfantilAmpliado",
  "horasOficiosHogar",
  "clasificacionCargaDomestica",
  "situacionPrincipal",
  "riesgoFinal",
];

const CLEANING_RULES = [
  "El archivo original se conserva sin modificaciones.",
  "Se crea una copia procesada en cleaned.json para analisis de la sesion.",
  "Se normalizan encabezados eliminando espacios y usando nombres tecnicos en mayuscula.",
  "Se normalizan valores vacios y marcadores nulos a null.",
  "Se derivan campos analiticos: sexo, edad, estudia, trabaja y riesgo final.",
  "Se calculan horas semanales de oficios del hogar y clasificacion de carga domestica.",
  "Se calcula trabajo economico, oficios intensivos y trabajo infantil ampliado.",
];

function toAnalysisRow(normalizedRow, dataset, index) {
  const derived = deriveDashboardRecord(normalizedRow, dataset, index);

  return {
    ...normalizedRow,
    anio: derived.year,
    sexo: derived.sex,
    edad: derived.age,
    estudia: derived.studies,
    trabaja: derived.works,
    trabajoEconomico: derived.economicWork,
    oficiosIntensivos: derived.intensiveChores,
    trabajoInfantilAmpliado: derived.expandedChildLabor,
    horasOficiosHogar: derived.domesticHours,
    clasificacionCargaDomestica: derived.domesticCategory,
    situacionPrincipal: derived.situation,
    riesgoFinal: derived.riskFinal,
  };
}

function getOrderedHeaders(rows, rawHeaders) {
  const normalizedHeaders = rawHeaders.map((header) => String(header || "").trim().replace(/\s+/g, "_").toUpperCase());
  const seenHeaders = new Set();
  const orderedHeaders = [];

  for (const header of [...DERIVED_COLUMNS, ...normalizedHeaders]) {
    if (!seenHeaders.has(header)) {
      seenHeaders.add(header);
      orderedHeaders.push(header);
    }
  }

  for (const row of rows) {
    for (const header of Object.keys(row)) {
      if (!seenHeaders.has(header)) {
        seenHeaders.add(header);
        orderedHeaders.push(header);
      }
    }
  }

  return orderedHeaders;
}

export function buildPreview(headers, rows, limit = 8, width = 10) {
  const visibleHeaders = headers.slice(0, width);

  return {
    headers: visibleHeaders,
    rows: rows.slice(0, limit).map((row) =>
      Object.fromEntries(visibleHeaders.map((header) => [header, row[header] ?? ""]))
    ),
  };
}

export function cleanRows(rows, options = {}) {
  const dataset = options.dataset || { id: "dataset", detectedYear: null };
  const rawHeaders = options.headers || [];
  const normalizedRows = normalizeRows(rows);
  const cleanedRows = normalizedRows.map((row, index) => toAnalysisRow(row, dataset, index));
  const cleanedHeaders = getOrderedHeaders(cleanedRows, rawHeaders);

  return {
    rows: cleanedRows,
    headers: cleanedHeaders,
    preview: buildPreview(cleanedHeaders, cleanedRows),
    rules: CLEANING_RULES,
    issues: [],
  };
}

import { detectIndicatorCoverage } from "@/lib/analytics/indicator-coverage";
import { DATASET_STATUS } from "@/lib/constants/dataset-status";
import { cleanRows } from "@/lib/csv/cleaner";
import { filterRowsForPasto } from "@/lib/csv/pasto-filter";
import { parseCsvText } from "@/lib/csv/parser";
import { validateDatasetStructure } from "@/lib/csv/validator";
import { detectYearFromFileName, detectYearFromRows } from "@/lib/csv/year-detector";

function buildRawPreview(headers, rows, limit = 8, width = 10) {
  const visibleHeaders = headers.slice(0, width);
  return {
    headers: visibleHeaders,
    rows: rows.slice(0, limit).map((row) =>
      Object.fromEntries(visibleHeaders.map((header) => [header, row[header] || ""]))
    ),
  };
}

function buildProcessLogs({ now, parsed, detectedYear, validation, status, pastoFilter }) {
  return [
    {
      at: now,
      step: "lectura",
      status: "complete",
      message: `CSV leido con ${parsed.rows.length} filas y ${parsed.headers.length} columnas.`,
    },
    {
      at: now,
      step: "filtro_pasto",
      status: pastoFilter.applied ? "complete" : "warning",
      message: pastoFilter.applied
        ? `Filtro Pasto aplicado (${pastoFilter.rule}). Filas: ${pastoFilter.keptRows}/${pastoFilter.sourceRows}.`
        : "No se encontro columna geografica reconocida para filtrar Pasto.",
    },
    {
      at: now,
      step: "validacion",
      status: validation.isValid ? "complete" : "error",
      message: validation.isValid
        ? "Estructura minima valida."
        : `Faltan columnas obligatorias: ${validation.missingColumns.join(", ")}.`,
    },
    {
      at: now,
      step: "deteccion_anio",
      status: detectedYear ? "complete" : "warning",
      message: detectedYear ? `Año detectado: ${detectedYear}.` : "No fue posible detectar el año.",
    },
    {
      at: now,
      step: "limpieza",
      status: status === DATASET_STATUS.CLEAN ? "complete" : "error",
      message:
        status === DATASET_STATUS.CLEAN
          ? "Limpieza y normalizacion completadas."
          : "No se pudo completar limpieza por validacion estructural.",
    },
  ];
}

function buildIssues({ parsed, validation, detectedYear, indicatorCoverage, pastoFilter }) {
  return [
    ...parsed.errors.slice(0, 20).map((error) => `CSV: ${error.message}`),
    ...validation.missingColumns.map((column) => `Falta columna obligatoria: ${column}`),
    ...validation.warnings.slice(0, 50),
    ...pastoFilter.issues,
    ...(detectedYear ? [] : ["No se pudo detectar el año desde columna ni nombre de archivo."]),
    ...(!indicatorCoverage.economicWork ? ["Cobertura parcial: faltan columnas de trabajo economico."] : []),
    ...(!indicatorCoverage.intensiveChores ? ["Cobertura parcial: faltan columnas de oficios intensivos."] : []),
    ...(!indicatorCoverage.expandedChildLabor
      ? ["Cobertura parcial: no se puede calcular trabajo infantil ampliado comparable."]
      : []),
  ];
}

export function buildDatasetFromCsvText({
  datasetId,
  sourceType = "upload",
  fileName,
  csvText,
  forcedYear = null,
  yearSource = null,
  isPrimary = false,
}) {
  const now = new Date().toISOString();
  const parsedSource = parseCsvText(csvText);
  const pastoResult = filterRowsForPasto(parsedSource.rows, parsedSource.headers);
  const parsed = {
    ...parsedSource,
    sourceRows: parsedSource.rows.length,
    rows: pastoResult.rows,
  };

  const validation = validateDatasetStructure(parsed.headers, parsed.rows);
  const detectedYearFromRows = detectYearFromRows(parsed.headers, parsed.rows);
  const detectedYearFromName = detectYearFromFileName(fileName);
  const detectedYear = forcedYear || detectedYearFromRows || detectedYearFromName || "unknown";
  const detectedYearSource =
    yearSource ||
    (forcedYear ? "seed" : detectedYearFromRows ? "column" : detectedYearFromName ? "filename" : "unknown");
  const indicatorCoverage = detectIndicatorCoverage(parsed.headers);
  const status = validation.isValid ? DATASET_STATUS.CLEAN : DATASET_STATUS.ERROR;
  const cleanResult = validation.isValid
    ? cleanRows(parsed.rows, {
        headers: parsed.headers,
        dataset: {
          id: datasetId,
          detectedYear: detectedYear === "unknown" ? null : detectedYear,
          indicatorCoverage,
        },
        indicatorCoverage,
      })
    : null;

  const issues = buildIssues({
    parsed,
    validation,
    detectedYear: detectedYear === "unknown" ? null : detectedYear,
    indicatorCoverage,
    pastoFilter: pastoResult,
  });

  const process = {
    id: `process-${datasetId}`,
    datasetId,
    status,
    currentStep: status === DATASET_STATUS.CLEAN ? "clean" : "error",
    startedAt: now,
    finishedAt: now,
    logs: buildProcessLogs({
      now,
      parsed,
      detectedYear: detectedYear === "unknown" ? null : detectedYear,
      validation,
      status,
      pastoFilter: pastoResult.summary,
    }),
    errorMessage: status === DATASET_STATUS.ERROR ? issues[0] || "Error de validacion." : null,
  };

  return {
    dataset: {
      id: datasetId,
      sourceType,
      fileName,
      detectedYear,
      yearSource: detectedYearSource,
      isPrimary,
      status,
      rowCount: parsed.rows.length,
      sourceRowCount: parsed.sourceRows,
      columnCount: parsed.headers.length,
      uploadedAt: now,
      updatedAt: now,
      rawCsvText: String(csvText || "").replace(/^\uFEFF/, ""),
      rawRows: parsed.rows,
      cleanedRows: cleanResult?.rows || [],
      previewBefore: buildRawPreview(parsed.headers, parsed.rows),
      previewAfter: cleanResult?.preview || buildRawPreview(parsed.headers, parsed.rows),
      columns: parsed.headers,
      cleanedColumns: cleanResult?.headers || [],
      indicatorCoverage,
      cleaningRulesApplied: cleanResult?.rules || [],
      issues,
      summary: {
        delimiter: parsed.delimiter,
        validation,
        pastoFilter: pastoResult.summary,
      },
    },
    process,
  };
}

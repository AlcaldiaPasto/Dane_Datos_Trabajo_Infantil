import { promises as fs } from "node:fs";
import path from "node:path";
import { detectIndicatorCoverage } from "../analytics/indicator-coverage.js";
import { deriveDashboardRecord } from "../analytics/dashboard-calculations.js";
import { DATASET_STATUS } from "../constants/dataset-status.js";
import { cleanRows } from "../csv/cleaner.js";
import { buildPastoFilterRule, filterRowsForPasto } from "../csv/pasto-filter.js";
import { parseCsvText } from "../csv/parser.js";
import { validateDatasetStructure } from "../csv/validator.js";
import { detectYearFromFileName, detectYearFromRows } from "../csv/year-detector.js";

export function sanitizeFileName(fileName) {
  return String(fileName || "dataset.csv")
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 120);
}

function buildRawPreview(headers, rows, limit = 8) {
  const visibleHeaders = headers.slice(0, 10);

  return {
    headers: visibleHeaders,
    rows: rows.slice(0, limit).map((row) =>
      Object.fromEntries(visibleHeaders.map((header) => [header, row[header] || ""]))
    ),
  };
}

export function buildProcessLog({ now, parsed, validation, detectedYear, status, duplicateOf, archiveInfo, pastoFilter }) {
  const log = [
    {
      label: "Archivo recibido",
      note: archiveInfo?.isArchive
        ? "Se recibio un ZIP y se preparo la copia temporal del CSV extraido para la sesion."
        : "Se recibio el CSV y se preparo una copia temporal para la sesion.",
      status: "complete",
      createdAt: now,
    },
  ];

  if (archiveInfo?.isArchive) {
    log.push({
      label: "Extraccion ZIP",
      note: `Se leyo el archivo interno ${archiveInfo.sourceCsvName} dentro del ZIP.`,
      status: "complete",
      createdAt: now,
    });
  }

  log.push({
    label: "Lectura CSV",
    note: `Se detectaron ${parsed.sourceRows ?? parsed.rows.length} filas originales, ${parsed.headers.length} columnas y separador '${parsed.delimiter || ","}'.`,
    status: parsed.errors.length ? "warning" : "complete",
    createdAt: now,
  });

  if (pastoFilter) {
    log.push({
      label: "Filtro territorial Pasto",
      note: pastoFilter.applied
        ? `Se conservaron ${pastoFilter.keptRows} de ${pastoFilter.sourceRows} filas usando ${pastoFilter.rule}.`
        : "No se encontro columna geografica reconocida; se conservaron las filas originales.",
      status: pastoFilter.applied ? "complete" : "warning",
      createdAt: now,
    });
  }

  log.push(
    {
      label: "Validacion estructural",
      note: validation.isValid
        ? "La estructura minima requerida esta presente."
        : `Faltan columnas obligatorias: ${validation.missingColumns.join(", ")}.`,
      status: validation.isValid ? "complete" : "error",
      createdAt: now,
    },
    {
      label: "Validacion avanzada",
      note: validation.warnings.length
        ? `Se registraron ${validation.warnings.length} advertencias de columnas, codigos o rangos.`
        : "No se registraron advertencias avanzadas en las columnas evaluadas.",
      status: validation.warnings.length ? "warning" : "complete",
      createdAt: now,
    },
    {
      label: "Deteccion de año",
      note: detectedYear ? `Año detectado: ${detectedYear}.` : "No fue posible detectar el año.",
      status: detectedYear ? "complete" : "warning",
      createdAt: now,
    }
  );

  if (duplicateOf) {
    log.push({
      label: "Duplicado detectado",
      note: `El archivo coincide con el dataset ${duplicateOf}.`,
      status: "error",
      createdAt: now,
    });
  } else if (status === DATASET_STATUS.CLEAN) {
    log.push({
      label: "Limpieza completada",
      note: "Se genero cleaned.json con campos derivados para analisis.",
      status: "complete",
      createdAt: now,
    });
  }

  return log;
}

export async function processCsvText({
  csvText,
  originalFileName,
  sourceCsvName,
  archiveInfo,
  datasetId,
  datasetDir,
  existingMetadata = {},
  contentHash,
}) {
  const parsedSource = parseCsvText(csvText);
  const pastoFilter = filterRowsForPasto(parsedSource.rows, parsedSource.headers);
  const parsed = {
    ...parsedSource,
    rows: pastoFilter.rows,
    sourceRows: parsedSource.rows.length,
  };
  const validation = validateDatasetStructure(parsed.headers, parsed.rows);
  const indicatorCoverage = detectIndicatorCoverage(parsed.headers);
  const yearFromRows = detectYearFromRows(parsed.headers, parsed.rows);
  const detectedYear = yearFromRows || detectYearFromFileName(sourceCsvName) || detectYearFromFileName(originalFileName);
  const yearSource = yearFromRows ? "column" : detectedYear ? "filename" : "unknown";
  const now = new Date().toISOString();
  const safeFileName = sanitizeFileName(originalFileName);
  const rawPath = path.join(datasetDir, "raw.csv");
  const cleanPath = path.join(datasetDir, "cleaned.json");
  const dashboardRecordsPath = path.join(datasetDir, "dashboard-records.json");
  const metadataPath = path.join(datasetDir, "metadata.json");
  const issues = [
    ...parsed.errors.slice(0, 10).map((error) => `CSV: ${error.message}`),
    ...validation.missingColumns.map((column) => `Falta columna obligatoria: ${column}`),
    ...validation.warnings.slice(0, 50),
    ...pastoFilter.issues,
    ...(detectedYear ? [] : ["No se pudo detectar el año desde columna ni nombre de archivo."]),
    ...(!indicatorCoverage.economicWork ? ["Cobertura parcial: faltan columnas de trabajo economico."] : []),
    ...(!indicatorCoverage.intensiveChores ? ["Cobertura parcial: faltan columnas para oficios intensivos."] : []),
    ...(!indicatorCoverage.expandedChildLabor ? ["Cobertura parcial: no se puede calcular trabajo infantil ampliado."] : []),
  ];
  const status = validation.isValid ? DATASET_STATUS.CLEAN : DATASET_STATUS.ERROR;
  const preview = buildRawPreview(parsed.headers, parsed.rows);
  const datasetContext = {
    id: datasetId,
    detectedYear,
    indicatorCoverage,
  };
  const cleanResult = validation.isValid
    ? cleanRows(parsed.rows, { headers: parsed.headers, dataset: datasetContext, indicatorCoverage })
    : null;

  if (cleanResult) {
    const dashboardRecords = cleanResult.rows.map((row, index) => deriveDashboardRecord(row, datasetContext, index));
    await fs.writeFile(
      cleanPath,
      JSON.stringify(
        {
          datasetId,
          sourceFileName: safeFileName,
          sourceCsvName: sourceCsvName || originalFileName,
          archiveInfo: archiveInfo || null,
          detectedYear,
          rowCount: cleanResult.rows.length,
          sourceRowCount: parsed.sourceRows,
          columnCount: cleanResult.headers.length,
          columns: cleanResult.headers,
          rows: cleanResult.rows,
          pastoFilter: pastoFilter.summary,
          generatedAt: now,
        },
        null,
        2
      ),
      "utf8"
    );
    await fs.writeFile(
      dashboardRecordsPath,
      JSON.stringify(
        {
          datasetId,
          detectedYear,
          rowCount: dashboardRecords.length,
          records: dashboardRecords,
          generatedAt: now,
        },
        null,
        2
      ),
      "utf8"
    );
  } else {
    await fs.rm(cleanPath, { force: true });
    await fs.rm(dashboardRecordsPath, { force: true });
  }

  const metadata = {
    ...existingMetadata,
    id: datasetId,
    sourceType: "upload",
    fileName: safeFileName,
    originalFileName,
    sourceCsvName: sourceCsvName || originalFileName,
    archiveInfo: archiveInfo || null,
    detectedYear,
    yearSource,
    indicatorCoverage,
    isPrimary: false,
    status,
    readyForAnalysis: status === DATASET_STATUS.CLEAN,
    rowCount: parsed.rows.length,
    sourceRowCount: parsed.sourceRows,
    columnCount: parsed.headers.length,
    uploadedAt: existingMetadata.uploadedAt || now,
    updatedAt: now,
    rawPath,
    cleanPath: cleanResult ? cleanPath : null,
    dashboardRecordsPath: cleanResult ? dashboardRecordsPath : null,
    contentHash: contentHash || existingMetadata.contentHash || null,
    columns: parsed.headers,
    cleanedColumns: cleanResult?.headers || [],
    pastoFilter: pastoFilter.summary,
    previewBefore: preview,
    previewAfter: cleanResult?.preview || preview,
    cleaningRulesApplied: [
      "Archivo original guardado sin alteraciones en almacenamiento temporal de sesion.",
      "Encabezados leidos y normalizados para validacion inicial.",
      "Validacion estructural contra columnas obligatorias minimas.",
      "Validacion avanzada de columnas sugeridas, duplicados, catalogos y rangos esperados.",
      `Separador CSV detectado automaticamente: ${parsed.delimiter || ","}.`,
      archiveInfo?.isArchive ? `ZIP procesado: se extrajo ${archiveInfo.sourceCsvName} dentro del ZIP.` : null,
      buildPastoFilterRule(pastoFilter.summary),
      "Deteccion de año por columna o nombre de archivo.",
      ...(cleanResult?.rules || []),
    ].filter(Boolean),
    issues,
    processLog: buildProcessLog({ now, parsed, validation, detectedYear, status, archiveInfo, pastoFilter: pastoFilter.summary }),
  };

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf8");

  return {
    ok: status === DATASET_STATUS.CLEAN,
    statusCode: status === DATASET_STATUS.CLEAN ? 201 : 422,
    dataset: metadata,
    issues,
  };
}

import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { DATASET_STATUS } from "@/lib/constants/dataset-status";
import { cleanRows } from "@/lib/csv/cleaner";
import { parseCsvText } from "@/lib/csv/parser";
import { validateDatasetStructure } from "@/lib/csv/validator";
import { detectYearFromFileName, detectYearFromRows } from "@/lib/csv/year-detector";
import { listRegisteredDatasets } from "@/lib/datasets/dataset-registry";
import { getDefaultSessionId } from "@/lib/session/session-manager";
import { getSessionsRoot } from "@/lib/storage/file-store";

function sanitizeFileName(fileName) {
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

function buildProcessLog({ now, parsed, validation, detectedYear, status, duplicateOf }) {
  const log = [
    {
      label: "Archivo recibido",
      note: "Se recibio el CSV y se preparo una copia temporal para la sesion.",
      status: "complete",
      createdAt: now,
    },
    {
      label: "Lectura CSV",
      note: `Se detectaron ${parsed.rows.length} filas, ${parsed.headers.length} columnas y separador '${parsed.delimiter || ","}'.`,
      status: parsed.errors.length ? "warning" : "complete",
      createdAt: now,
    },
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
      label: "Deteccion de ano",
      note: detectedYear ? `Ano detectado: ${detectedYear}.` : "No fue posible detectar el ano.",
      status: detectedYear ? "complete" : "warning",
      createdAt: now,
    },
  ];

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

async function findDuplicateDataset(contentHash) {
  const datasets = await listRegisteredDatasets();
  return datasets.find((dataset) => dataset.sourceType === "upload" && dataset.contentHash === contentHash) || null;
}

export async function processCsvText({
  csvText,
  originalFileName,
  datasetId,
  datasetDir,
  existingMetadata = {},
  contentHash,
}) {
  const parsed = parseCsvText(csvText);
  const validation = validateDatasetStructure(parsed.headers, parsed.rows);
  const yearFromRows = detectYearFromRows(parsed.headers, parsed.rows);
  const detectedYear = yearFromRows || detectYearFromFileName(originalFileName);
  const yearSource = yearFromRows ? "column" : detectedYear ? "filename" : "unknown";
  const now = new Date().toISOString();
  const safeFileName = sanitizeFileName(originalFileName);
  const rawPath = path.join(datasetDir, "raw.csv");
  const cleanPath = path.join(datasetDir, "cleaned.json");
  const metadataPath = path.join(datasetDir, "metadata.json");
  const issues = [
    ...parsed.errors.slice(0, 10).map((error) => `CSV: ${error.message}`),
    ...validation.missingColumns.map((column) => `Falta columna obligatoria: ${column}`),
    ...validation.warnings.slice(0, 50),
    ...(detectedYear ? [] : ["No se pudo detectar el anio desde columna ni nombre de archivo."]),
  ];
  const status = validation.isValid ? DATASET_STATUS.CLEAN : DATASET_STATUS.ERROR;
  const preview = buildRawPreview(parsed.headers, parsed.rows);
  const datasetContext = {
    id: datasetId,
    detectedYear,
  };
  const cleanResult = validation.isValid
    ? cleanRows(parsed.rows, { headers: parsed.headers, dataset: datasetContext })
    : null;

  if (cleanResult) {
    await fs.writeFile(
      cleanPath,
      JSON.stringify(
        {
          datasetId,
          sourceFileName: safeFileName,
          detectedYear,
          rowCount: cleanResult.rows.length,
          columnCount: cleanResult.headers.length,
          columns: cleanResult.headers,
          rows: cleanResult.rows,
          generatedAt: now,
        },
        null,
        2
      ),
      "utf8"
    );
  } else {
    await fs.rm(cleanPath, { force: true });
  }

  const metadata = {
    ...existingMetadata,
    id: datasetId,
    sourceType: "upload",
    sessionId: existingMetadata.sessionId || getDefaultSessionId(),
    fileName: safeFileName,
    originalFileName,
    detectedYear,
    yearSource,
    isPrimary: false,
    status,
    readyForAnalysis: status === DATASET_STATUS.CLEAN,
    rowCount: parsed.rows.length,
    columnCount: parsed.headers.length,
    uploadedAt: existingMetadata.uploadedAt || now,
    updatedAt: now,
    rawPath,
    cleanPath: cleanResult ? cleanPath : null,
    contentHash: contentHash || existingMetadata.contentHash || null,
    columns: parsed.headers,
    cleanedColumns: cleanResult?.headers || [],
    previewBefore: preview,
    previewAfter: cleanResult?.preview || preview,
    cleaningRulesApplied: [
      "Archivo original guardado sin alteraciones en almacenamiento temporal de sesion.",
      "Encabezados leidos y normalizados para validacion inicial.",
      "Validacion estructural contra columnas obligatorias minimas.",
      "Validacion avanzada de columnas sugeridas, duplicados, catalogos y rangos esperados.",
      `Separador CSV detectado automaticamente: ${parsed.delimiter || ","}.`,
      "Deteccion de anio por columna o nombre de archivo.",
      ...(cleanResult?.rules || []),
    ],
    issues,
    processLog: buildProcessLog({ now, parsed, validation, detectedYear, status }),
  };

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf8");

  return {
    ok: status === DATASET_STATUS.CLEAN,
    statusCode: status === DATASET_STATUS.CLEAN ? 201 : 422,
    dataset: metadata,
    issues,
  };
}

export async function ingestCsvFile(file) {
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return {
      ok: false,
      statusCode: 400,
      error: "No se recibio ningun archivo CSV.",
    };
  }

  const originalFileName = file.name || "dataset.csv";

  if (!originalFileName.toLowerCase().endsWith(".csv")) {
    return {
      ok: false,
      statusCode: 400,
      error: "El archivo debe tener extension .csv.",
    };
  }

  const csvText = Buffer.from(await file.arrayBuffer()).toString("utf8").replace(/^\uFEFF/, "");
  const contentHash = createHash("sha256").update(csvText).digest("hex");
  const duplicate = await findDuplicateDataset(contentHash);

  if (duplicate) {
    const now = new Date().toISOString();
    return {
      ok: false,
      statusCode: 409,
      error: `El archivo ya fue cargado como ${duplicate.fileName}.`,
      dataset: duplicate,
      issues: [`Archivo duplicado. Dataset existente: ${duplicate.fileName}.`],
      processLog: buildProcessLog({
        now,
        parsed: { rows: [], headers: [], errors: [] },
        validation: { isValid: false, missingColumns: [], warnings: [] },
        detectedYear: duplicate.detectedYear,
        status: DATASET_STATUS.ERROR,
        duplicateOf: duplicate.id,
      }),
    };
  }

  const datasetId = `upload-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const sessionId = getDefaultSessionId();
  const datasetDir = path.join(getSessionsRoot(), sessionId, datasetId);
  const rawPath = path.join(datasetDir, "raw.csv");

  await fs.mkdir(datasetDir, { recursive: true });
  await fs.writeFile(rawPath, csvText, "utf8");

  return processCsvText({
    csvText,
    originalFileName,
    datasetId,
    datasetDir,
    contentHash,
  });
}

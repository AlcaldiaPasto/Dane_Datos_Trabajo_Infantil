import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { DATASET_STATUS } from "@/lib/constants/dataset-status";
import { validateDatasetStructure } from "@/lib/csv/validator";
import { detectYearFromFileName, detectYearFromRows } from "@/lib/csv/year-detector";
import { getDefaultSessionId } from "@/lib/session/session-manager";
import { getSessionsRoot } from "@/lib/storage/file-store";

function sanitizeFileName(fileName) {
  return String(fileName || "dataset.csv")
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 120);
}

function buildPreview(headers, rows, limit = 8) {
  const visibleHeaders = headers.slice(0, 10);

  return {
    headers: visibleHeaders,
    rows: rows.slice(0, limit).map((row) =>
      Object.fromEntries(visibleHeaders.map((header) => [header, row[header] || ""]))
    ),
  };
}

function parseCsv(csvText) {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => String(header || "").trim(),
  });

  const headers = parsed.meta.fields || [];
  const rows = parsed.data.filter((row) =>
    Object.values(row).some((value) => String(value || "").trim() !== "")
  );

  return {
    headers,
    rows,
    errors: parsed.errors || [],
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
  const parsed = parseCsv(csvText);
  const validation = validateDatasetStructure(parsed.headers);
  const yearFromRows = detectYearFromRows(parsed.headers, parsed.rows);
  const detectedYear = yearFromRows || detectYearFromFileName(originalFileName);
  const yearSource = yearFromRows ? "column" : detectedYear ? "filename" : "unknown";
  const datasetId = `upload-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const sessionId = getDefaultSessionId();
  const datasetDir = path.join(getSessionsRoot(), sessionId, datasetId);
  const rawPath = path.join(datasetDir, "raw.csv");
  const metadataPath = path.join(datasetDir, "metadata.json");
  const issues = [
    ...parsed.errors.slice(0, 10).map((error) => `CSV: ${error.message}`),
    ...validation.missingColumns.map((column) => `Falta columna obligatoria: ${column}`),
    ...(detectedYear ? [] : ["No se pudo detectar el anio desde columna ni nombre de archivo."]),
  ];
  const status = validation.isValid ? DATASET_STATUS.CLEAN : DATASET_STATUS.ERROR;
  const now = new Date().toISOString();
  const safeFileName = sanitizeFileName(originalFileName);
  const preview = buildPreview(parsed.headers, parsed.rows);
  const metadata = {
    id: datasetId,
    sourceType: "upload",
    sessionId,
    fileName: safeFileName,
    originalFileName,
    detectedYear,
    yearSource,
    isPrimary: false,
    status,
    readyForAnalysis: status === DATASET_STATUS.CLEAN,
    rowCount: parsed.rows.length,
    columnCount: parsed.headers.length,
    uploadedAt: now,
    updatedAt: now,
    rawPath,
    columns: parsed.headers,
    previewBefore: preview,
    previewAfter: preview,
    cleaningRulesApplied: [
      "Archivo original guardado sin alteraciones en almacenamiento temporal de sesion.",
      "Encabezados leidos y normalizados para validacion inicial.",
      "Validacion estructural contra columnas obligatorias minimas.",
      "Deteccion de anio por columna o nombre de archivo.",
    ],
    issues,
  };

  await fs.mkdir(datasetDir, { recursive: true });
  await fs.writeFile(rawPath, csvText, "utf8");
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf8");

  return {
    ok: status === DATASET_STATUS.CLEAN,
    statusCode: status === DATASET_STATUS.CLEAN ? 201 : 422,
    dataset: metadata,
    issues,
  };
}

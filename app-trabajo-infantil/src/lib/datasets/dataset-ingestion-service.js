import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { DATASET_STATUS } from "@/lib/constants/dataset-status";
import { cleanRows } from "@/lib/csv/cleaner";
import { buildPastoFilterRule, filterRowsForPasto } from "@/lib/csv/pasto-filter";
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

function normalizeCsvText(content) {
  return String(content || "").replace(/^\uFEFF/, "");
}

function isCsvFileName(fileName) {
  return String(fileName || "").toLowerCase().endsWith(".csv");
}

function isZipFileName(fileName) {
  return String(fileName || "").toLowerCase().endsWith(".zip");
}

function findCsvEntryInZip(zip) {
  return Object.values(zip.files).find((entry) => {
    const normalizedName = entry.name.toLowerCase();
    return !entry.dir && normalizedName.startsWith("csv/") && normalizedName.endsWith(".csv");
  });
}

async function readUploadedCsvSource(file, originalFileName) {
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  if (isCsvFileName(originalFileName)) {
    return {
      ok: true,
      csvText: normalizeCsvText(fileBuffer.toString("utf8")),
      archiveInfo: null,
      sourceCsvName: originalFileName,
    };
  }

  if (!isZipFileName(originalFileName)) {
    return {
      ok: false,
      statusCode: 400,
      error: "El archivo debe tener extension .csv o .zip.",
    };
  }

  try {
    const zip = await JSZip.loadAsync(fileBuffer);
    const csvEntry = findCsvEntryInZip(zip);

    if (!csvEntry) {
      return {
        ok: false,
        statusCode: 422,
        error: "El ZIP debe contener al menos un archivo CSV dentro de la carpeta CSV.",
      };
    }

    return {
      ok: true,
      csvText: normalizeCsvText(await csvEntry.async("string")),
      archiveInfo: {
        isArchive: true,
        archiveName: originalFileName,
        sourceCsvName: csvEntry.name,
      },
      sourceCsvName: csvEntry.name,
    };
  } catch {
    return {
      ok: false,
      statusCode: 422,
      error: "No fue posible leer el ZIP. Verifica que no este corrupto y que incluya la carpeta CSV.",
    };
  }
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

function buildProcessLog({ now, parsed, validation, detectedYear, status, duplicateOf, archiveInfo, pastoFilter }) {
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
      note: `Se leyo el archivo interno ${archiveInfo.sourceCsvName} desde la carpeta CSV del ZIP.`,
      status: "complete",
      createdAt: now,
    });
  }

  log.push(
    {
      label: "Lectura CSV",
      note: `Se detectaron ${parsed.sourceRows ?? parsed.rows.length} filas originales, ${parsed.headers.length} columnas y separador '${parsed.delimiter || ","}'.`,
      status: parsed.errors.length ? "warning" : "complete",
      createdAt: now,
    }
  );

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
      label: "Deteccion de ano",
      note: detectedYear ? `Ano detectado: ${detectedYear}.` : "No fue posible detectar el ano.",
      status: detectedYear ? "complete" : "warning",
      createdAt: now,
    },
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

async function findDuplicateDataset(contentHash) {
  const datasets = await listRegisteredDatasets();
  return datasets.find((dataset) => dataset.sourceType === "upload" && dataset.contentHash === contentHash) || null;
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
  const yearFromRows = detectYearFromRows(parsed.headers, parsed.rows);
  const detectedYear = yearFromRows || detectYearFromFileName(sourceCsvName) || detectYearFromFileName(originalFileName);
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
    ...pastoFilter.issues,
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
    sourceCsvName: sourceCsvName || originalFileName,
    archiveInfo: archiveInfo || null,
    detectedYear,
    yearSource,
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
      archiveInfo?.isArchive ? `ZIP procesado: se extrajo ${archiveInfo.sourceCsvName} desde la carpeta CSV.` : null,
      buildPastoFilterRule(pastoFilter.summary),
      "Deteccion de anio por columna o nombre de archivo.",
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

export async function ingestCsvFile(file) {
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return {
      ok: false,
      statusCode: 400,
      error: "No se recibio ningun archivo CSV o ZIP.",
    };
  }

  const originalFileName = file.name || "dataset.csv";

  if (!isCsvFileName(originalFileName) && !isZipFileName(originalFileName)) {
    return {
      ok: false,
      statusCode: 400,
      error: "El archivo debe tener extension .csv o .zip.",
    };
  }

  const source = await readUploadedCsvSource(file, originalFileName);

  if (!source.ok) {
    return source;
  }

  const { csvText, archiveInfo, sourceCsvName } = source;
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
    sourceCsvName,
    archiveInfo,
    datasetId,
    datasetDir,
    contentHash,
  });
}

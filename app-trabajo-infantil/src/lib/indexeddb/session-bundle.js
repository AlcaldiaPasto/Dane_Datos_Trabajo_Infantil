import JSZip from "jszip";
import { DATASET_STATUS } from "@/lib/constants/dataset-status";
import { ensureClientBootstrap } from "@/lib/indexeddb/bootstrap";
import { buildDatasetFromCsvText } from "@/lib/indexeddb/client-dataset-processing";
import { trabajoInfantilDb } from "@/lib/indexeddb/db";
import { BASE_DATASET_ID, GLOBAL_APP_STATE_ID } from "@/lib/indexeddb/repository";

const SESSION_ZIP_FORMAT = "trabajo-infantil-indexeddb-session-v1";
const BASE_DATASET_URL = "/data/base/2024/dane-2024.csv";

function buildExportFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `sesion-indexeddb-${stamp}.zip`;
}

function parseJson(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeZipPath(fileName) {
  return String(fileName || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

function sanitizeStep(value, fallback = "restauracion") {
  const safe = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return safe || fallback;
}

function normalizeDatasetStatus(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if ([DATASET_STATUS.PENDING, DATASET_STATUS.PROCESSING, DATASET_STATUS.CLEAN, DATASET_STATUS.ERROR].includes(normalized)) {
    return normalized;
  }

  if (["ok", "ready", "complete", "completed", "limpio"].includes(normalized)) {
    return DATASET_STATUS.CLEAN;
  }

  if (["running", "in_progress", "procesando"].includes(normalized)) {
    return DATASET_STATUS.PROCESSING;
  }

  if (["queued", "pendiente"].includes(normalized)) {
    return DATASET_STATUS.PENDING;
  }

  return DATASET_STATUS.ERROR;
}

function toIsoDate(value, fallback) {
  const date = new Date(value || fallback);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function normalizeDetectedYear(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : "unknown";
}

function toPreview(rows, width = 10, limit = 8) {
  if (!Array.isArray(rows) || !rows.length || typeof rows[0] !== "object" || !rows[0]) {
    return { headers: [], rows: [] };
  }

  const headers = Object.keys(rows[0]).slice(0, width);
  return {
    headers,
    rows: rows.slice(0, limit).map((row) =>
      Object.fromEntries(headers.map((header) => [header, row?.[header] ?? ""]))
    ),
  };
}

function normalizeLegacyLogs(processLog, fallbackAt) {
  const items = Array.isArray(processLog) ? processLog : [];
  if (!items.length) {
    return [
      {
        at: fallbackAt,
        step: "restauracion",
        status: "complete",
        message: "Proceso restaurado desde ZIP legado.",
      },
    ];
  }

  return items.map((entry, index) => ({
    at: toIsoDate(entry?.createdAt || entry?.at, fallbackAt),
    step: sanitizeStep(entry?.label || entry?.step, `legacy_${index + 1}`),
    status: normalizeDatasetStatus(entry?.status),
    message: String(entry?.note || entry?.message || entry?.label || `Etapa ${index + 1} restaurada.`),
  }));
}

function findSiblingZipFile(zipFilesMap, folderPath, fileName) {
  const exact = zipFilesMap.get(`${folderPath.toLowerCase()}${String(fileName || "").toLowerCase()}`);
  if (exact) return exact;

  const fallback = [...zipFilesMap.entries()].find(([entryPath]) =>
    entryPath.startsWith(folderPath.toLowerCase()) &&
    entryPath.split("/").pop() === String(fileName || "").toLowerCase()
  );

  return fallback ? fallback[1] : null;
}

function triggerDownload(fileName, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function readZipJson(zip, entryPath, fallback = null) {
  const entry = zip.file(entryPath);
  if (!entry) return fallback;
  return parseJson(await entry.async("string"), fallback);
}

async function seedBaseDatasetIfMissing() {
  const existingBase = await trabajoInfantilDb.datasets.get(BASE_DATASET_ID);
  if (existingBase) return;

  const response = await fetch(BASE_DATASET_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("No se pudo restaurar el dataset base 2024.");
  }

  const csvText = await response.text();
  const { dataset, process } = buildDatasetFromCsvText({
    datasetId: BASE_DATASET_ID,
    sourceType: "base",
    fileName: "dane-2024.csv",
    csvText,
    forcedYear: 2024,
    yearSource: "seed",
    isPrimary: true,
  });

  await trabajoInfantilDb.datasets.put({
    ...dataset,
    status: DATASET_STATUS.CLEAN,
    isPrimary: true,
  });
  await trabajoInfantilDb.processes.put({
    ...process,
    status: DATASET_STATUS.CLEAN,
    currentStep: "clean",
    errorMessage: null,
  });
}

async function ensureGlobalAppState() {
  const current = await trabajoInfantilDb.appState.get(GLOBAL_APP_STATE_ID);
  if (current) return;

  await trabajoInfantilDb.appState.put({
    id: GLOBAL_APP_STATE_ID,
    activeYear: 2024,
    activeDatasetId: BASE_DATASET_ID,
    selectedFilters: {},
    lastOpenedSection: "/",
    updatedAt: new Date().toISOString(),
  });
}

export async function buildLocalSessionZipBlob() {
  await ensureClientBootstrap();
  const [datasets, processes, appState] = await Promise.all([
    trabajoInfantilDb.datasets.toArray(),
    trabajoInfantilDb.processes.toArray(),
    trabajoInfantilDb.appState.toArray(),
  ]);

  const manifest = {
    format: SESSION_ZIP_FORMAT,
    exportedAt: new Date().toISOString(),
    counts: {
      datasets: datasets.length,
      processes: processes.length,
      appState: appState.length,
    },
  };

  const zip = new JSZip();
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("stores/datasets.json", JSON.stringify(datasets, null, 2));
  zip.file("stores/processes.json", JSON.stringify(processes, null, 2));
  zip.file("stores/appState.json", JSON.stringify(appState, null, 2));

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  return {
    blob,
    fileName: buildExportFileName(),
    manifest,
  };
}

export async function downloadLocalSessionZip() {
  const { blob, fileName, manifest } = await buildLocalSessionZipBlob();
  triggerDownload(fileName, blob);
  return { fileName, manifest };
}

async function readIndexedDbBundlePayload(zip) {
  const hasStores =
    Boolean(zip.file("stores/datasets.json")) ||
    Boolean(zip.file("stores/processes.json")) ||
    Boolean(zip.file("stores/appState.json"));

  if (!hasStores) {
    return null;
  }

  const rawDatasets = await readZipJson(zip, "stores/datasets.json", null);
  const rawProcesses = await readZipJson(zip, "stores/processes.json", null);
  const rawAppState = await readZipJson(zip, "stores/appState.json", null);

  if (rawDatasets !== null && !Array.isArray(rawDatasets)) {
    throw new Error("El ZIP tiene stores/datasets.json invalido.");
  }
  if (rawProcesses !== null && !Array.isArray(rawProcesses)) {
    throw new Error("El ZIP tiene stores/processes.json invalido.");
  }
  if (rawAppState !== null && !Array.isArray(rawAppState)) {
    throw new Error("El ZIP tiene stores/appState.json invalido.");
  }

  return {
    sourceFormat: "indexeddb-v1",
    datasets: toArray(rawDatasets).filter((item) => item && typeof item.id === "string"),
    processes: toArray(rawProcesses).filter((item) => item && typeof item.id === "string"),
    appState: toArray(rawAppState).filter((item) => item && typeof item.id === "string"),
  };
}

async function readLegacySessionBundlePayload(zip) {
  const zipFiles = Object.values(zip.files).filter((entry) => !entry.dir);
  const metadataEntries = zipFiles.filter((entry) => /(^|\/)metadata\.json$/i.test(normalizeZipPath(entry.name)));
  if (!metadataEntries.length) {
    return null;
  }

  const zipFilesMap = new Map(
    zipFiles.map((entry) => [normalizeZipPath(entry.name).toLowerCase(), entry])
  );

  const datasets = [];
  const processes = [];

  for (const metadataEntry of metadataEntries) {
    const metadataPath = normalizeZipPath(metadataEntry.name);
    const metadataFolder = metadataPath.includes("/") ? metadataPath.slice(0, metadataPath.lastIndexOf("/") + 1) : "";
    const metadataFolderParts = metadataFolder.split("/").filter(Boolean);
    const folderDerivedDatasetId = metadataFolderParts.length
      ? metadataFolderParts[metadataFolderParts.length - 1]
      : null;
    const metadata = parseJson(await metadataEntry.async("string"), null);
    if (!metadata || typeof metadata !== "object") {
      continue;
    }

    const datasetId = String(metadata.id || folderDerivedDatasetId || `legacy-${datasets.length + 1}`);
    const now = new Date().toISOString();
    const uploadedAt = toIsoDate(metadata.uploadedAt, now);
    const updatedAt = toIsoDate(metadata.updatedAt, uploadedAt);
    const status = normalizeDatasetStatus(metadata.status);
    const cleanedEntry = findSiblingZipFile(zipFilesMap, metadataFolder, "cleaned.json");
    const rawEntry = findSiblingZipFile(zipFilesMap, metadataFolder, "raw.csv");
    const cleanedPayload = cleanedEntry ? parseJson(await cleanedEntry.async("string"), null) : null;
    const cleanedRows = Array.isArray(cleanedPayload?.rows) ? cleanedPayload.rows : [];
    const columns =
      Array.isArray(metadata.columns) && metadata.columns.length
        ? metadata.columns
        : Array.isArray(cleanedPayload?.columns)
          ? cleanedPayload.columns
          : [];
    const cleanedColumns =
      Array.isArray(metadata.cleanedColumns) && metadata.cleanedColumns.length
        ? metadata.cleanedColumns
        : Array.isArray(cleanedPayload?.columns)
          ? cleanedPayload.columns
          : columns;
    const rawCsvText = rawEntry ? String(await rawEntry.async("string")).replace(/^\uFEFF/, "") : "";
    const detectedYear = normalizeDetectedYear(metadata.detectedYear);
    const issues = Array.isArray(metadata.issues) ? metadata.issues : [];
    const processLogs = normalizeLegacyLogs(metadata.processLog, updatedAt);

    datasets.push({
      id: datasetId,
      sourceType:
        datasetId === BASE_DATASET_ID || metadata.sourceType === "base"
          ? "base"
          : "upload",
      fileName: String(metadata.fileName || metadata.originalFileName || `${datasetId}.csv`),
      originalFileName: metadata.originalFileName || metadata.fileName || null,
      sourceCsvName: metadata.sourceCsvName || metadata.originalFileName || metadata.fileName || null,
      archiveInfo: metadata.archiveInfo || null,
      detectedYear,
      yearSource: metadata.yearSource || "unknown",
      isPrimary: Boolean(metadata.isPrimary || datasetId === BASE_DATASET_ID),
      status,
      rowCount: Number.isFinite(Number(metadata.rowCount)) ? Number(metadata.rowCount) : cleanedRows.length,
      sourceRowCount: Number.isFinite(Number(metadata.sourceRowCount))
        ? Number(metadata.sourceRowCount)
        : Number.isFinite(Number(metadata.rowCount))
          ? Number(metadata.rowCount)
          : cleanedRows.length,
      columnCount: Number.isFinite(Number(metadata.columnCount)) ? Number(metadata.columnCount) : columns.length,
      uploadedAt,
      updatedAt,
      rawCsvText,
      rawRows: Array.isArray(metadata.rawRows) ? metadata.rawRows : [],
      cleanedRows,
      previewBefore: metadata.previewBefore || toPreview(cleanedRows),
      previewAfter: metadata.previewAfter || toPreview(cleanedRows),
      columns,
      cleanedColumns,
      indicatorCoverage: metadata.indicatorCoverage || null,
      cleaningRulesApplied: Array.isArray(metadata.cleaningRulesApplied) ? metadata.cleaningRulesApplied : [],
      issues,
      summary: {
        ...(metadata.summary && typeof metadata.summary === "object" ? metadata.summary : {}),
        importedFrom: "legacy-session-bundle-v1",
        pastoFilter: metadata.pastoFilter || metadata.summary?.pastoFilter || null,
      },
      readyForAnalysis: status === DATASET_STATUS.CLEAN,
    });

    processes.push({
      id: `process-${datasetId}`,
      datasetId,
      status,
      currentStep:
        status === DATASET_STATUS.CLEAN
          ? "clean"
          : status === DATASET_STATUS.ERROR
            ? "error"
            : status,
      startedAt: uploadedAt,
      finishedAt: [DATASET_STATUS.CLEAN, DATASET_STATUS.ERROR].includes(status) ? updatedAt : null,
      logs: processLogs,
      errorMessage: status === DATASET_STATUS.ERROR ? issues[0] || "Error restaurado desde ZIP legado." : null,
    });
  }

  return {
    sourceFormat: "legacy-v1",
    datasets,
    processes,
    appState: [],
  };
}

export async function restoreLocalSessionFromZipFile(file) {
  if (!file) {
    throw new Error("Selecciona un archivo ZIP de sesion.");
  }

  await ensureClientBootstrap();

  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const manifest = await readZipJson(zip, "manifest.json", null);
  const indexedDbPayload = await readIndexedDbBundlePayload(zip);
  const legacyPayload = indexedDbPayload ? null : await readLegacySessionBundlePayload(zip);
  const payload = indexedDbPayload || legacyPayload;

  if (!payload) {
    throw new Error(
      "El ZIP no tiene un formato compatible. Usa un ZIP generado por esta app o un respaldo legado de sesion-procesada."
    );
  }

  if (!payload.datasets.length && !payload.processes.length && !payload.appState.length) {
    throw new Error("El ZIP no contiene datos restaurables.");
  }

  await trabajoInfantilDb.transaction(
    "rw",
    trabajoInfantilDb.datasets,
    trabajoInfantilDb.processes,
    trabajoInfantilDb.appState,
    async () => {
      await trabajoInfantilDb.datasets.clear();
      await trabajoInfantilDb.processes.clear();
      await trabajoInfantilDb.appState.clear();

      if (payload.datasets.length) await trabajoInfantilDb.datasets.bulkPut(payload.datasets);
      if (payload.processes.length) await trabajoInfantilDb.processes.bulkPut(payload.processes);
      if (payload.appState.length) await trabajoInfantilDb.appState.bulkPut(payload.appState);
    }
  );

  await seedBaseDatasetIfMissing();
  await ensureGlobalAppState();

  const [finalDatasets, finalProcesses] = await Promise.all([
    trabajoInfantilDb.datasets.count(),
    trabajoInfantilDb.processes.count(),
  ]);

  return {
    message: "Sesion local restaurada correctamente.",
    restoredFiles: payload.sourceFormat === "legacy-v1" ? 1 : 3,
    restoredDatasets: finalDatasets,
    restoredProcesses: finalProcesses,
    format: payload.sourceFormat || manifest?.format || "unknown",
  };
}
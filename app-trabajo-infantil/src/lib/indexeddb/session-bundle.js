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

export async function restoreLocalSessionFromZipFile(file) {
  if (!file) {
    throw new Error("Selecciona un archivo ZIP de sesion.");
  }

  await ensureClientBootstrap();

  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const manifest = await readZipJson(zip, "manifest.json", null);
  const rawDatasets = await readZipJson(zip, "stores/datasets.json", []);
  const rawProcesses = await readZipJson(zip, "stores/processes.json", []);
  const rawAppState = await readZipJson(zip, "stores/appState.json", []);

  if (!Array.isArray(rawDatasets) || !Array.isArray(rawProcesses) || !Array.isArray(rawAppState)) {
    throw new Error("El ZIP no tiene el formato esperado de sesion local.");
  }

  const datasets = rawDatasets.filter((item) => item && typeof item.id === "string");
  const processes = rawProcesses.filter((item) => item && typeof item.id === "string");
  const appState = rawAppState.filter((item) => item && typeof item.id === "string");

  await trabajoInfantilDb.transaction(
    "rw",
    trabajoInfantilDb.datasets,
    trabajoInfantilDb.processes,
    trabajoInfantilDb.appState,
    async () => {
      await trabajoInfantilDb.datasets.clear();
      await trabajoInfantilDb.processes.clear();
      await trabajoInfantilDb.appState.clear();

      if (datasets.length) await trabajoInfantilDb.datasets.bulkPut(datasets);
      if (processes.length) await trabajoInfantilDb.processes.bulkPut(processes);
      if (appState.length) await trabajoInfantilDb.appState.bulkPut(appState);
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
    restoredFiles: 3,
    restoredDatasets: finalDatasets,
    restoredProcesses: finalProcesses,
    format: manifest?.format || "unknown",
  };
}


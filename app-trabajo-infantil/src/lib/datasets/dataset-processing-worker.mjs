import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parentPort, workerData } from "node:worker_threads";
import JSZip from "jszip";
import { DATASET_STATUS } from "../constants/dataset-status.js";
import { buildProcessLog, processCsvText } from "./dataset-processor-core.js";

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

async function readUploadedCsvSource(uploadPath, originalFileName) {
  const fileBuffer = await fs.readFile(uploadPath);

  if (isCsvFileName(originalFileName)) {
    return {
      csvText: normalizeCsvText(fileBuffer.toString("utf8")),
      archiveInfo: null,
      sourceCsvName: originalFileName,
    };
  }

  if (!isZipFileName(originalFileName)) {
    throw new Error("El archivo debe tener extension .csv o .zip.");
  }

  const zip = await JSZip.loadAsync(fileBuffer);
  const csvEntry = findCsvEntryInZip(zip);

  if (!csvEntry) {
    throw new Error("El ZIP debe contener al menos un archivo CSV dentro de la carpeta CSV.");
  }

  return {
    csvText: normalizeCsvText(await csvEntry.async("string")),
    archiveInfo: {
      isArchive: true,
      archiveName: originalFileName,
      sourceCsvName: csvEntry.name,
    },
    sourceCsvName: csvEntry.name,
  };
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content.replace(/^\uFEFF/, ""));
}

async function findDuplicateDataset({ sessionsRoot, datasetId, contentHash }) {
  const sessionFolders = await fs.readdir(sessionsRoot, { withFileTypes: true }).catch(() => []);

  for (const sessionFolder of sessionFolders) {
    if (!sessionFolder.isDirectory()) continue;
    const sessionPath = path.join(sessionsRoot, sessionFolder.name);
    const datasetFolders = await fs.readdir(sessionPath, { withFileTypes: true }).catch(() => []);

    for (const datasetFolder of datasetFolders) {
      if (!datasetFolder.isDirectory() || datasetFolder.name === datasetId) continue;
      const metadataPath = path.join(sessionPath, datasetFolder.name, "metadata.json");
      const metadata = await readJson(metadataPath).catch(() => null);
      if (metadata?.sourceType === "upload" && metadata.contentHash === contentHash) {
        return metadata;
      }
    }
  }

  return null;
}

async function writeErrorMetadata({ metadataPath, existingMetadata, message }) {
  const now = new Date().toISOString();
  const metadata = {
    ...existingMetadata,
    status: DATASET_STATUS.ERROR,
    readyForAnalysis: false,
    updatedAt: now,
    issues: [...(existingMetadata.issues || []), message],
    processLog: [
      ...(existingMetadata.processLog || []),
      {
        label: "Procesamiento en segundo plano",
        note: message,
        status: "error",
        createdAt: now,
      },
    ],
  };

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf8");
  return metadata;
}

async function main() {
  const {
    datasetId,
    datasetDir,
    sessionsRoot,
    uploadPath,
    originalFileName,
  } = workerData;
  const metadataPath = path.join(datasetDir, "metadata.json");
  const rawPath = path.join(datasetDir, "raw.csv");
  const existingMetadata = await readJson(metadataPath);
  const source = await readUploadedCsvSource(uploadPath, originalFileName);
  const contentHash = createHash("sha256").update(source.csvText).digest("hex");
  const duplicate = await findDuplicateDataset({ sessionsRoot, datasetId, contentHash });

  if (duplicate) {
    const now = new Date().toISOString();
    const metadata = {
      ...existingMetadata,
      status: DATASET_STATUS.ERROR,
      readyForAnalysis: false,
      contentHash,
      updatedAt: now,
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
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf8");
    parentPort?.postMessage({ ok: false, datasetId, error: "duplicado" });
    return;
  }

  await fs.writeFile(rawPath, source.csvText, "utf8");
  const result = await processCsvText({
    csvText: source.csvText,
    originalFileName,
    sourceCsvName: source.sourceCsvName,
    archiveInfo: source.archiveInfo,
    datasetId,
    datasetDir,
    existingMetadata,
    contentHash,
  });

  parentPort?.postMessage({ ok: result.ok, datasetId, status: result.dataset.status });
}

main().catch(async (error) => {
  const metadataPath = path.join(workerData.datasetDir, "metadata.json");
  const existingMetadata = await readJson(metadataPath).catch(() => ({}));
  await writeErrorMetadata({
    metadataPath,
    existingMetadata,
    message: error?.message || "No fue posible procesar el archivo en segundo plano.",
  });
  parentPort?.postMessage({ ok: false, datasetId: workerData.datasetId, error: error?.message });
});

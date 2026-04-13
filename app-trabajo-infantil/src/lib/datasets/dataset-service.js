import { promises as fs } from "node:fs";
import path from "node:path";
import { PRIMARY_YEAR } from "@/lib/constants/year-rules";
import { processCsvText } from "@/lib/datasets/dataset-ingestion-service";
import { listRegisteredDatasets, getRegisteredDatasetById } from "@/lib/datasets/dataset-registry";
import { serializeDataset } from "@/lib/datasets/dataset-serializer";
import { getSessionsRoot } from "@/lib/storage/file-store";

function isBaseDataset(datasetId) {
  return datasetId === "base-2024";
}

function isSafeSessionPath(targetPath) {
  const sessionsRoot = path.resolve(getSessionsRoot());
  const resolvedTarget = path.resolve(targetPath);
  return resolvedTarget === sessionsRoot || resolvedTarget.startsWith(`${sessionsRoot}${path.sep}`);
}

export async function listDatasets() {
  const datasets = await listRegisteredDatasets();
  return datasets.map(serializeDataset).sort((left, right) => {
    if (left.detectedYear === PRIMARY_YEAR) return -1;
    if (right.detectedYear === PRIMARY_YEAR) return 1;
    return String(right.detectedYear || "").localeCompare(String(left.detectedYear || ""));
  });
}

export async function getDatasetById(datasetId) {
  const dataset = await getRegisteredDatasetById(datasetId);
  return dataset ? serializeDataset(dataset) : null;
}

export async function getDatasetDetailById(datasetId) {
  return getDatasetById(datasetId);
}

export async function deleteDatasetById(datasetId) {
  if (isBaseDataset(datasetId)) {
    return { ok: false, error: "El dataset base 2024 no se puede eliminar de la aplicacion.", statusCode: 400 };
  }

  const dataset = await getRegisteredDatasetById(datasetId);
  if (!dataset) {
    return { ok: false, error: "Dataset no encontrado.", statusCode: 404 };
  }

  if (dataset.sourceType !== "upload") {
    return { ok: false, error: "Solo se pueden eliminar datasets cargados en sesion.", statusCode: 400 };
  }

  const datasetDir = path.dirname(dataset.rawPath || "");
  if (!datasetDir || !isSafeSessionPath(datasetDir)) {
    return { ok: false, error: "Ruta de dataset no valida para eliminacion.", statusCode: 400 };
  }

  await fs.rm(datasetDir, { recursive: true, force: true });
  return { ok: true, statusCode: 200 };
}

export async function reprocessDatasetById(datasetId) {
  if (isBaseDataset(datasetId)) {
    return { ok: false, error: "El dataset base 2024 se procesa desde la fuente fija y no se reprocesa en sesion.", statusCode: 400 };
  }

  const dataset = await getRegisteredDatasetById(datasetId);
  if (!dataset) {
    return { ok: false, error: "Dataset no encontrado.", statusCode: 404 };
  }

  if (dataset.sourceType !== "upload" || !dataset.rawPath) {
    return { ok: false, error: "Solo se pueden reprocesar datasets cargados en sesion.", statusCode: 400 };
  }

  const datasetDir = path.dirname(dataset.rawPath);
  if (!isSafeSessionPath(datasetDir)) {
    return { ok: false, error: "Ruta de dataset no valida para reprocesamiento.", statusCode: 400 };
  }

  const csvText = await fs.readFile(dataset.rawPath, "utf8");
  const result = await processCsvText({
    csvText: csvText.replace(/^\uFEFF/, ""),
    originalFileName: dataset.originalFileName || dataset.fileName,
    datasetId,
    datasetDir,
    existingMetadata: dataset,
    contentHash: dataset.contentHash,
  });

  return {
    ...result,
    statusCode: result.ok ? 200 : result.statusCode,
  };
}

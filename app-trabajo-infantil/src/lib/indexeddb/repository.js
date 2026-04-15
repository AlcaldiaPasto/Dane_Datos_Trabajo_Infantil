import { trabajoInfantilDb } from "@/lib/indexeddb/db";
import { PRIMARY_YEAR } from "@/lib/constants/year-rules";
import { serializeDataset } from "@/lib/datasets/dataset-serializer";

export const BASE_DATASET_ID = "base-2024";
export const GLOBAL_APP_STATE_ID = "global";

export async function getDatasetById(datasetId) {
  return trabajoInfantilDb.datasets.get(datasetId);
}

export async function getDatasetDetailLocal(datasetId) {
  const dataset = await getDatasetById(datasetId);
  if (!dataset) return null;
  return {
    ...serializeDataset(dataset),
    storageEngine: "indexeddb",
  };
}

export function sortDatasetsForUi(left, right) {
  if (left.detectedYear === PRIMARY_YEAR) return -1;
  if (right.detectedYear === PRIMARY_YEAR) return 1;
  return String(right.detectedYear || "").localeCompare(String(left.detectedYear || ""));
}

export async function listDatasetsLocal() {
  const datasets = await trabajoInfantilDb.datasets.toArray();
  return datasets
    .map((dataset) => ({
      ...serializeDataset(dataset),
      storageEngine: "indexeddb",
    }))
    .sort(sortDatasetsForUi);
}

export async function listCleanDatasetsLocal() {
  return trabajoInfantilDb.datasets.where("status").equals("clean").toArray();
}

export async function deleteDatasetLocal(datasetId) {
  await trabajoInfantilDb.datasets.delete(datasetId);
  await trabajoInfantilDb.processes.delete(`process-${datasetId}`);
}

export async function putDataset(dataset) {
  await trabajoInfantilDb.datasets.put(dataset);
  return dataset;
}

export async function putProcess(processRecord) {
  await trabajoInfantilDb.processes.put(processRecord);
  return processRecord;
}

export async function getAppState() {
  return trabajoInfantilDb.appState.get(GLOBAL_APP_STATE_ID);
}

export async function putAppState(nextState) {
  const previous = (await getAppState()) || {};
  const merged = {
    ...previous,
    ...nextState,
    id: GLOBAL_APP_STATE_ID,
    updatedAt: new Date().toISOString(),
  };
  await trabajoInfantilDb.appState.put(merged);
  return merged;
}

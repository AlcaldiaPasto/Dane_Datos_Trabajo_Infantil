import { PRIMARY_YEAR } from "@/lib/constants/year-rules";
import { listRegisteredDatasets, getRegisteredDatasetById } from "@/lib/datasets/dataset-registry";
import { serializeDataset } from "@/lib/datasets/dataset-serializer";

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
  if (datasetId === "base-2024") {
    return { ok: false, error: "El dataset base 2024 no se puede eliminar de la aplicacion.", statusCode: 400 };
  }
  return { ok: false, error: "La eliminacion de datasets cargados se implementara en el Paso 4.", statusCode: 501 };
}

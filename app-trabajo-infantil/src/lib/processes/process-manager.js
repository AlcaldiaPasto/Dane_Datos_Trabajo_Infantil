import { listDatasets } from "@/lib/datasets/dataset-service";

function getProgress(status) {
  if (status === "clean") return 100;
  if (status === "error") return 100;
  if (status === "processing") return 60;
  return 10;
}

function getFallbackSteps(dataset) {
  if (dataset.isPrimary) {
    return [
      { label: "Registro del dataset base", note: "El CSV 2024 esta disponible como base principal del sistema.", status: "complete" },
      { label: "Lectura de metadatos", note: "Se detectaron filas, columnas y vista previa para el dashboard inicial.", status: "complete" },
      { label: "Limpieza en lectura", note: "La vista procesada se calcula al leer el dataset base.", status: "complete" },
    ];
  }

  return [
    { label: "Dataset registrado", note: "El archivo esta registrado en la sesion local.", status: "complete" },
    { label: "Estado actual", note: `Estado del dataset: ${dataset.status}.`, status: dataset.status === "error" ? "error" : "complete" },
  ];
}

export async function getCurrentProcesses() {
  const datasets = await listDatasets();

  return datasets
    .map((dataset) => ({
      datasetId: dataset.id,
      label: dataset.isPrimary
        ? "Dataset base 2024 listo para analisis inicial"
        : `${dataset.fileName} - ${dataset.displayYear}`,
      progress: getProgress(dataset.status),
      status: dataset.status,
      steps: dataset.processLog?.length ? dataset.processLog : getFallbackSteps(dataset),
    }))
    .sort((left, right) => {
      if (left.datasetId === "base-2024") return 1;
      if (right.datasetId === "base-2024") return -1;
      return 0;
    });
}

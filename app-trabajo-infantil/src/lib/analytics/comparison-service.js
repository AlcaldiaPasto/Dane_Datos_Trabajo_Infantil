import { PRIMARY_YEAR } from "@/lib/constants/year-rules";

export function buildComparisonSnapshot(datasets) {
  const cleanDatasets = datasets.filter((dataset) => dataset.status === "clean");
  const comparisonCandidates = cleanDatasets.filter((dataset) => dataset.detectedYear !== PRIMARY_YEAR);
  if (!comparisonCandidates.length) {
    return { isReady: false, message: "Solo esta disponible 2024. No hay suficiente informacion limpia para comparar incremento o disminucion entre años." };
  }
  const comparisonTarget = comparisonCandidates[0];
  return {
    isReady: true,
    message: `Se comparara ${PRIMARY_YEAR} contra ${comparisonTarget.detectedYear} cuando la capa de indicadores quede activada.`,
    kpis: [
      { label: "Año base", value: String(PRIMARY_YEAR), note: "Referencia principal del dashboard." },
      { label: "Año comparado", value: String(comparisonTarget.detectedYear), note: "Primer dataset limpio adicional." },
      { label: "Modo", value: "Preparado", note: "Pendiente de calculo de diferencias reales." },
    ],
  };
}

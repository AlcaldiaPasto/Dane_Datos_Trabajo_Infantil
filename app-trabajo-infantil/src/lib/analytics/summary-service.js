export function buildExecutiveSummary(snapshot) {
  return {
    paragraphs: [
      `El dashboard muestra el Año ${snapshot.primaryYear} por defecto y recalcula indicadores con los filtros activos.`,
      "Las graficas se enfocan en situacion principal, carga domestica, edad, sexo e indicadores de trabajo infantil ampliado.",
      snapshot.annualComparison.isVisible
        ? "Existe al menos otro dataset limpio para mostrar comparacion anual."
        : "Por ahora solo existe 2024 como base limpia; la comparacion anual queda desactivada hasta cargar otro Año.",
    ],
  };
}

export function buildDatasetStatusSummary(datasets) {
  return [
    { label: "Total", value: datasets.length },
    { label: "Limpios", value: datasets.filter((dataset) => dataset.status === "clean").length },
    {
      label: "Procesando",
      value: datasets.filter((dataset) => dataset.status === "processing").length,
    },
    { label: "Error", value: datasets.filter((dataset) => dataset.status === "error").length },
  ];
}

export async function getCurrentProcesses() {
  return [
    {
      datasetId: "base-2024",
      label: "Dataset base 2024 listo para analisis inicial",
      progress: 100,
      steps: [
        { label: "Registro del dataset base", note: "Se copio el CSV 2024 al proyecto como base principal del sistema." },
        { label: "Lectura de metadatos", note: "Se detectaron filas, columnas y vista previa para el dashboard inicial." },
        { label: "Preparacion de modulos", note: "Se crearon servicios y rutas API para las fases de carga, validacion y limpieza." },
      ],
    },
  ];
}

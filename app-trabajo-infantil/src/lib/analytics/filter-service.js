export function getAvailableFilters() {
  return [
    {
      key: "year",
      label: "Anio",
      defaultLabel: "2024",
      description: "Base activa por defecto para el dashboard.",
    },
    {
      key: "sexo",
      label: "Sexo",
      defaultLabel: "Todos",
      description: "Filtro preparado para femenino y masculino.",
    },
    {
      key: "edad",
      label: "Edad",
      defaultLabel: "5 a 17",
      description: "Rango de edad presente en el dataset.",
    },
    {
      key: "trabaja",
      label: "Trabaja",
      defaultLabel: "Todos",
      description: "Separara menores con y sin trabajo economico.",
    },
    {
      key: "estudia",
      label: "Estudia",
      defaultLabel: "Todos",
      description: "Separara menores que estudian y no estudian.",
    },
    {
      key: "riesgoFinal",
      label: "Riesgo final",
      defaultLabel: "Todos",
      description: "Preparado para trabajo ampliado y oficios intensivos.",
    },
  ];
}

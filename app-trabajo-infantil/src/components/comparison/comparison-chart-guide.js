import Card from "@/components/ui/card";

function buildTargetScopeLabel(snapshot) {
  if (snapshot.mode === "all") {
    return `todos los años limpios (${snapshot.comparisonYears[0]}-${snapshot.comparisonYears[snapshot.comparisonYears.length - 1]})`;
  }

  return `${snapshot.baseYear} vs ${snapshot.targetYear}`;
}

export default function ComparisonChartGuide({ snapshot }) {
  const scopeLabel = buildTargetScopeLabel(snapshot);

  return (
    <Card
      title="Que representa cada grafica"
      subtitle={`Interpretacion del modo actual de comparacion: ${scopeLabel}.`}
      className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]"
    >
      <div className="grid gap-3 text-sm leading-6 text-muted md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white px-4 py-3">
          <p className="font-semibold text-foreground">1) Comparacion porcentual por indicador</p>
          <p className="mt-1">
            Compara por año el porcentaje de trabajo economico, oficios intensivos y trabajo infantil ampliado.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white px-4 py-3">
          <p className="font-semibold text-foreground">2) Trabajo infantil por edad (linea)</p>
          <p className="mt-1">
            Se muestra desde 2 años y compara por edad la cantidad de menores en trabajo infantil ampliado.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white px-4 py-3">
          <p className="font-semibold text-foreground">3) Tendencia de trabajo economico (linea)</p>
          <p className="mt-1">
            Se habilita solo con 3 o mas años y muestra evolucion del porcentaje de trabajo economico.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white px-4 py-3">
          <p className="font-semibold text-foreground">4) Cobertura parcial y no comparables</p>
          <p className="mt-1">
            Si algun año no trae variables equivalentes, ese indicador se marca como N/D para evitar comparaciones invalidas.
          </p>
        </div>
      </div>
    </Card>
  );
}


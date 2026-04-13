import Card from "@/components/ui/card";

export default function DatasetStatusList({ statusSummary }) {
  return (
    <Card title="Estado de la sesion" subtitle="Vista resumida de cuantos datasets hay en cada fase del ciclo de vida.">
      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statusSummary.map((item) => (
          <div key={item.label} className="rounded-2xl border border-line bg-surface px-4 py-4">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">{item.label}</p>
            <p className="mt-4 text-3xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

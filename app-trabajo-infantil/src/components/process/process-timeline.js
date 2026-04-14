import Card from "@/components/ui/card";

export default function ProcessTimeline({ steps }) {
  return (
    <Card title="Bitacora del proceso" subtitle="Registro de etapas de carga, validacion, limpieza o reprocesamiento.">
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={`${step.label}-${index}`} className="flex min-w-0 gap-3 rounded-2xl border border-line bg-surface px-4 py-4 sm:gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-xs text-accent">
              {index + 1}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{step.label}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{step.note}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

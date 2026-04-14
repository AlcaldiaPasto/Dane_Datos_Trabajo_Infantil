import Card from "@/components/ui/card";

const directionStyles = {
  up: "bg-rose-50 text-rose-700 border-rose-200",
  down: "bg-emerald-50 text-emerald-700 border-emerald-200",
  stable: "bg-slate-50 text-slate-700 border-slate-200",
};

const directionLabels = {
  up: "Sube",
  down: "Baja",
  stable: "Igual",
};

const directionIcons = {
  up: "+",
  down: "-",
  stable: "=",
};

export default function ComparisonKpis({ items, baseYear, targetYear }) {
  return (
    <div className="grid min-w-0 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="flex h-full flex-col justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">{item.label}</p>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded-2xl border border-line bg-surface px-4 py-3">
                  <p className="text-xs text-muted">{baseYear}</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{item.baseLabel}</p>
                </div>
                <div className="rounded-2xl border border-line bg-surface px-4 py-3">
                  <p className="text-xs text-muted">{targetYear}</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{item.targetLabel}</p>
                </div>
              </div>
            </div>
            <div>
              {item.isComparable === false ? (
                <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${directionStyles.stable}`}>
                  N/D No comparable
                </div>
              ) : (
                <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${directionStyles[item.direction]}`}>
                  {directionIcons[item.direction]} {directionLabels[item.direction]} {item.differenceLabel}
                </div>
              )}
              <p className="mt-2 text-xs font-semibold text-foreground">
                Cambio relativo: {item.isComparable === false ? "N/D" : item.percentDifferenceLabel}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">{item.note}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

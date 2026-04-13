import Card from "@/components/ui/card";

const toneClasses = {
  up: "border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(255,255,255,0.98))]",
  down: "border-amber-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.95),rgba(255,255,255,0.98))]",
  stable: "border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.95),rgba(255,255,255,0.98))]",
};

const arrowByDirection = {
  up: "↑",
  down: "↓",
  stable: "→",
};

export default function ComparisonBanner({ comparison }) {
  return (
    <Card
      title="Comparacion anual"
      subtitle="Visible para indicar si ya existe una segunda base limpia para contraste."
      className={toneClasses[comparison.direction] || toneClasses.stable}
      interactive
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-2xl text-foreground shadow-sm">
          {arrowByDirection[comparison.direction] || "→"}
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-foreground">{comparison.title}</p>
          <p className="text-sm leading-7 text-muted">{comparison.message}</p>
        </div>
      </div>
    </Card>
  );
}

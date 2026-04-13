import Card from "@/components/ui/card";

export default function ComparisonChart({ title, message }) {
  return (
    <Card title={title} subtitle="La grafica comparativa real llegara en el Paso 9 con series por año y diferencias absolutas y porcentuales.">
      <div className="rounded-2xl border border-dashed border-line bg-surface px-5 py-8 text-sm leading-7 text-muted">{message}</div>
    </Card>
  );
}

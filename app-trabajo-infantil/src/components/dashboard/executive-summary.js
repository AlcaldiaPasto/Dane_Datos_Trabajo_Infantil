import Card from "@/components/ui/card";

export default function ExecutiveSummary({ summary }) {
  return (
    <Card title="Resumen ejecutivo" subtitle="Texto base del sistema. Se enriquecera cuando exista limpieza y agregacion de indicadores reales.">
      <div className="space-y-4 text-sm leading-7 text-muted">
        {summary.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </Card>
  );
}

import Card from "@/components/ui/card";

export default function ExecutiveSummary({ summary }) {
  return (
    <Card title="Resumen ejecutivo" subtitle="Sintesis generada desde los indicadores y el estado actual de datasets limpios.">
      <div className="space-y-4 text-sm leading-7 text-muted">
        {summary.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </Card>
  );
}

import Card from "@/components/ui/card";

export default function DatasetColumnsTable({ columns }) {
  return (
    <Card title="Columnas detectadas" subtitle="Vista rapida del encabezado original del CSV de referencia.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {columns.map((column) => (
          <div key={column} className="rounded-2xl border border-line bg-surface px-4 py-3 font-mono text-xs text-foreground">{column}</div>
        ))}
      </div>
    </Card>
  );
}

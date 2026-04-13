import Card from "@/components/ui/card";

export default function DatasetPreviewTable({ title, preview }) {
  return (
    <Card title={title} subtitle="La vista previa procesada tomara forma cuando la etapa de limpieza quede implementada.">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.22em] text-muted">
              {preview.headers.map((header) => <th key={header} className="px-3 pb-2">{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, rowIndex) => (
              <tr key={`${title}-${rowIndex}`} className="bg-surface">
                {preview.headers.map((header) => <td key={`${title}-${rowIndex}-${header}`} className="px-3 py-3 text-sm text-muted">{row[header] || "-"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

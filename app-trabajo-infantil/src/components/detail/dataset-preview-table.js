import Card from "@/components/ui/card";

export default function DatasetPreviewTable({ title, preview }) {
  const headers = preview?.headers || [];
  const rows = preview?.rows || [];

  return (
    <Card title={title} subtitle="Vista previa generada desde la copia correspondiente del dataset.">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.22em] text-muted">
              {headers.map((header) => (
                <th key={header} className="px-3 pb-2">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${title}-${rowIndex}`} className="bg-surface">
                {headers.map((header) => (
                  <td key={`${title}-${rowIndex}-${header}`} className="px-3 py-3 text-sm text-muted">
                    {row[header] === null || row[header] === undefined || row[header] === "" ? "-" : String(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

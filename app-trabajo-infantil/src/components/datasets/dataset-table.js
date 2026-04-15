import StatusPill from "@/components/ui/status-pill";
import Card from "@/components/ui/card";
import DatasetActions from "@/components/datasets/dataset-actions";

export default function DatasetTable({ datasets }) {
  return (
    <Card
      title="Panel de datasets"
      subtitle="Listado administrativo de datasets disponibles en la sesion. El dataset 2024 se mantiene como base principal."
      interactive
      className="h-full min-w-0"
    >
      <div className="h-full min-w-0 overflow-x-auto overflow-y-auto">
        <table className="min-w-[900px] border-collapse lg:min-w-full">
          <thead>
            <tr className="border-b border-line bg-slate-50 text-left">
              <th className="rounded-l-2xl px-5 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
                Archivo
              </th>
              <th className="px-5 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
                Año
              </th>
              <th className="px-5 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
                Estado
              </th>
              <th className="px-5 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
                Filas
              </th>
              <th className="px-5 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
                Columnas
              </th>
              <th className="px-5 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
                Fecha de carga
              </th>
              <th className="rounded-r-2xl px-5 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {datasets.length ? (
              datasets.map((dataset) => (
                <tr key={dataset.id} className="border-b border-line transition hover:bg-slate-50/80">
                  <td className="px-5 py-5">
                    <div className="flex flex-col">
                      <span className="break-all text-sm font-semibold text-foreground">{dataset.fileName}</span>
                      <span className="mt-1 text-xs text-muted">
                        {dataset.isPrimary ? "Dataset principal por defecto" : "Dataset cargado en sesion"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-5 text-sm font-semibold text-foreground">{dataset.displayYear}</td>
                  <td className="px-5 py-5">
                    <StatusPill status={dataset.status} />
                  </td>
                  <td className="px-5 py-5 font-mono text-sm text-foreground">{dataset.rowCount}</td>
                  <td className="px-5 py-5 font-mono text-sm text-foreground">{dataset.columnCount}</td>
                  <td className="px-5 py-5 text-sm text-muted">{dataset.uploadedAtLabel}</td>
                  <td className="px-5 py-5">
                    <DatasetActions dataset={dataset} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted">
                  No hay datasets en almacenamiento local. Sube un CSV para iniciar el analisis.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

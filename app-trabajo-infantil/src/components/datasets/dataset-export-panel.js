import Card from "@/components/ui/card";

const buttonClass =
  "inline-flex items-center justify-center rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-foreground transition hover:border-accent hover:bg-accent-soft hover:text-accent";

export default function DatasetExportPanel({ dataset }) {
  const canExport = dataset.status === "clean";

  return (
    <Card
      title="Exportacion"
      subtitle="Descarga copias procesadas. El archivo original no se modifica."
      interactive
      className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]"
    >
      {canExport ? (
        <div className="flex flex-wrap gap-3">
          <a href={`/api/datasets/${dataset.id}/export?format=csv`} className={buttonClass}>
            CSV procesado
          </a>
          <a href={`/api/datasets/${dataset.id}/export?format=json`} className={buttonClass}>
            JSON procesado
          </a>
          <a href={`/api/datasets/${dataset.id}/export?format=summary`} className={buttonClass}>
            Resumen JSON
          </a>
        </div>
      ) : (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Este dataset todavia no esta limpio. Corrige el procesamiento antes de exportarlo.
        </p>
      )}
    </Card>
  );
}

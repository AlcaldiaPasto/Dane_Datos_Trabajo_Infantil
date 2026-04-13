import Card from "@/components/ui/card";

export default function SummaryTable({ rows }) {
  return (
    <Card
      title="Tabla resumen"
      subtitle="Resumen ejecutivo de la sesion activa con foco en estructura, comparabilidad y disponibilidad analitica."
      interactive
      className="p-4"
    >
      <div className="overflow-hidden rounded-[24px] border border-line">
        <table className="min-w-full border-collapse bg-white">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.26em] text-muted">
                Indicador
              </th>
              <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.26em] text-muted">
                Valor
              </th>
              <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.26em] text-muted">
                Soporte
              </th>
              <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.26em] text-muted">
                Tendencia
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.metric} className="border-t border-line transition hover:bg-slate-50/80">
                <td className="px-4 py-3 text-sm font-semibold text-foreground">{row.metric}</td>
                <td className="px-4 py-3 text-sm text-foreground">{row.value}</td>
                <td className="px-4 py-3 text-sm text-muted">{row.support}</td>
                <td className="px-4 py-3 text-sm text-muted">{row.trend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

import Card from "@/components/ui/card";

export default function IssueList({ issues }) {
  return (
    <Card title="Problemas encontrados" subtitle="Incidencias detectadas durante validacion, deteccion de anio y limpieza.">
      {issues.length ? (
        <ul className="space-y-3 text-sm leading-7 text-muted">
          {issues.map((issue) => (
            <li key={issue} className="rounded-2xl border border-line bg-surface px-4 py-3">
              {issue}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-line bg-surface px-4 py-4 text-sm text-muted">
          Sin incidencias registradas para este dataset.
        </div>
      )}
    </Card>
  );
}

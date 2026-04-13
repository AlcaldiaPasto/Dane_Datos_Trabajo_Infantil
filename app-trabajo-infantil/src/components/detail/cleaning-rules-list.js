import Card from "@/components/ui/card";

export default function CleaningRulesList({ rules }) {
  return (
    <Card title="Reglas registradas" subtitle="Se dejan visibles las reglas iniciales de referencia. La limpieza automatica detallada se construira en el Paso 5.">
      <ul className="space-y-3 text-sm leading-7 text-muted">
        {rules.map((rule) => <li key={rule} className="rounded-2xl border border-line bg-surface px-4 py-3">{rule}</li>)}
      </ul>
    </Card>
  );
}

import Card from "@/components/ui/card";

export default function CleaningRulesList({ rules }) {
  return (
    <Card title="Reglas de limpieza" subtitle="Reglas aplicadas para construir la copia procesada sin alterar el CSV original.">
      <ul className="space-y-3 text-sm leading-7 text-muted">
        {rules.map((rule) => (
          <li key={rule} className="rounded-2xl border border-line bg-surface px-4 py-3">
            {rule}
          </li>
        ))}
      </ul>
    </Card>
  );
}

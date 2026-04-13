import Card from "@/components/ui/card";

export default function ComparisonKpis({ items }) {
  return (
    <div className="grid items-stretch gap-4 md:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">{item.label}</p>
          <p className="mt-4 text-3xl font-semibold text-foreground">{item.value}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{item.note}</p>
        </Card>
      ))}
    </div>
  );
}

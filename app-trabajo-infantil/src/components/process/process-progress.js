import Card from "@/components/ui/card";

export default function ProcessProgress({ process }) {
  return (
    <Card title="Estado actual" subtitle="Progreso calculado desde el estado registrado del dataset.">
      <div className="space-y-4">
        <div className="h-3 rounded-full bg-slate-100">
          <div
            className="h-3 rounded-full bg-[linear-gradient(90deg,#0f766e_0%,#155e75_100%)]"
            style={{ width: `${process.progress}%` }}
          />
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="break-words">{process.label}</span>
          <span className="font-mono">{process.progress}%</span>
        </div>
      </div>
    </Card>
  );
}

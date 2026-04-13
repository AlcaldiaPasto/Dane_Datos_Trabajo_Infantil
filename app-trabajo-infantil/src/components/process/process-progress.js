import Card from "@/components/ui/card";

export default function ProcessProgress({ process }) {
  return (
    <Card title="Estado actual" subtitle="La barra real de progreso se conectara al procesamiento de archivos en el Paso 5.">
      <div className="space-y-4">
        <div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-[linear-gradient(90deg,#0f766e_0%,#155e75_100%)]" style={{ width: `${process.progress}%` }} /></div>
        <div className="flex items-center justify-between text-sm text-muted"><span>{process.label}</span><span className="font-mono">{process.progress}%</span></div>
      </div>
    </Card>
  );
}

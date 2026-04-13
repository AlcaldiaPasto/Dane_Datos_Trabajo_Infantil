import AppShell from "@/components/layout/app-shell";
import ProcessProgress from "@/components/process/process-progress";
import ProcessTimeline from "@/components/process/process-timeline";
import { getCurrentProcesses } from "@/lib/processes/process-manager";

export const dynamic = "force-dynamic";

export default async function ProcessesPage() {
  const processes = await getCurrentProcesses();
  const primaryProcess = processes[0];

  return (
    <AppShell
      title="Estado del procesamiento"
      description="Seguimiento de carga, validacion, limpieza y reproceso conectado al registro base del sistema."
      sidebarContext={{
        eyebrow: "Procesamiento",
        title: "Estado del proceso",
        description: "Seguimiento de carga, validacion, limpieza y reproceso de datasets.",
        badge: primaryProcess?.status || "sin procesos",
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <div className="flex w-full max-w-[860px] flex-col gap-6">
          {processes.map((process) => (
            <div key={process.datasetId} className="flex flex-col gap-6">
              <ProcessProgress process={process} />
              <ProcessTimeline steps={process.steps} />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

import AppShell from "@/components/layout/app-shell";
import ProcessesIndexedDbPage from "@/components/process/processes-indexeddb-page";

export const dynamic = "force-dynamic";

export default function ProcessesPage() {
  return (
    <AppShell
      title="Estado del procesamiento"
      description="Seguimiento de carga, validacion, limpieza y reproceso desde almacenamiento local IndexedDB."
      sidebarContext={{
        eyebrow: "Procesamiento",
        title: "Estado del proceso",
        description: "Seguimiento de carga, validacion, limpieza y reproceso de datasets locales.",
        badge: "Procesos locales",
      }}
    >
      <ProcessesIndexedDbPage />
    </AppShell>
  );
}


import AppShell from "@/components/layout/app-shell";
import SessionRestorePanel from "@/components/session/session-restore-panel";

export const dynamic = "force-dynamic";

export default function SessionRestorePage() {
  return (
    <AppShell
      title="Restaurar sesion"
      description="Carga un ZIP de sesion exportado para recuperar datasets procesados y continuar analisis."
      sidebarContext={{
        eyebrow: "Respaldo de sesion",
        title: "Restaurar sesion",
        description: "Importa un ZIP exportado para recuperar archivos procesados en esta aplicacion.",
        badge: "ZIP sesion",
      }}
    >
      <div className="flex min-h-full min-w-0 items-start justify-center py-2 sm:py-4 lg:items-center">
        <SessionRestorePanel />
      </div>
    </AppShell>
  );
}


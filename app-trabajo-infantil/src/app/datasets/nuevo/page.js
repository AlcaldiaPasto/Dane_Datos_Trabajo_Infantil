import AppShell from "@/components/layout/app-shell";
import CsvUploadPanel from "@/components/datasets/csv-upload-panel";

export const dynamic = "force-dynamic";

export default function NewDatasetPage() {
  return (
    <AppShell
      title="Subir nuevo CSV"
      description="Ingresa un archivo CSV del DANE para validarlo, detectar su ano y registrarlo en la sesion actual del sistema."
      sidebarContext={{
        eyebrow: "Carga de archivo",
        title: "Subir nuevo CSV",
        description: "Selecciona un CSV, valida su estructura y registralo en la sesion actual.",
        badge: "CSV DANE",
      }}
    >
      <div className="flex min-h-full min-w-0 items-start justify-center py-2 sm:py-4 lg:items-center">
        <CsvUploadPanel />
      </div>
    </AppShell>
  );
}

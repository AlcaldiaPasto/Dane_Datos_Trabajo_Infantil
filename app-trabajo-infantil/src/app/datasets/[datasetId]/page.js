import AppShell from "@/components/layout/app-shell";
import DatasetDetailIndexedDbContent from "@/components/detail/dataset-detail-indexeddb-content";

export const dynamic = "force-dynamic";

export default async function DatasetDetailPage({ params }) {
  const { datasetId } = await params;

  return (
    <AppShell
      title="Detalle del dataset"
      description="Metadatos, encabezados detectados, reglas registradas y vistas previas de la base local."
      sidebarContext={{
        eyebrow: "Detalle de dataset",
        title: "Dataset local",
        description: "Columnas, reglas, problemas y previews del archivo cargado en IndexedDB.",
        badge: "local",
      }}
    >
      <DatasetDetailIndexedDbContent datasetId={datasetId} />
    </AppShell>
  );
}


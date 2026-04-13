import AppShell from "@/components/layout/app-shell";
import DatasetTable from "@/components/datasets/dataset-table";
import DatasetUploadForm from "@/components/datasets/dataset-upload-form";
import DatasetStatusList from "@/components/datasets/dataset-status-list";
import { buildDatasetStatusSummary } from "@/lib/analytics/summary-service";
import { listDatasets } from "@/lib/datasets/dataset-service";

export const dynamic = "force-dynamic";

export default async function DatasetsPage() {
  const datasets = await listDatasets();
  const statusSummary = buildDatasetStatusSummary(datasets);

  return (
    <AppShell
      title="Gestion de datasets"
      description="Panel administrativo para revisar archivos cargados, estado de procesamiento, ano detectado, volumen y acceso al detalle."
      sidebarContext={{
        eyebrow: "Panel administrativo",
        title: "Gestion de datasets",
        description: "Revisa archivos cargados, estado, volumen y acceso al detalle.",
        actionLabel: "Subir CSV",
        actionHref: "/datasets/nuevo",
      }}
    >
      <div className="flex min-h-full flex-col gap-6">
        <DatasetStatusList statusSummary={statusSummary} />
        <DatasetUploadForm />
        <div className="min-h-0 flex-1">
          <DatasetTable datasets={datasets} />
        </div>
      </div>
    </AppShell>
  );
}

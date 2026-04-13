import { notFound } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import DatasetColumnsTable from "@/components/detail/dataset-columns-table";
import DatasetPreviewTable from "@/components/detail/dataset-preview-table";
import CleaningRulesList from "@/components/detail/cleaning-rules-list";
import IssueList from "@/components/detail/issue-list";
import DatasetExportPanel from "@/components/datasets/dataset-export-panel";
import { getDatasetDetailById } from "@/lib/datasets/dataset-service";

export const dynamic = "force-dynamic";

export default async function DatasetDetailPage({ params }) {
  const { datasetId } = await params;
  const dataset = await getDatasetDetailById(datasetId);
  if (!dataset) notFound();

  return (
    <AppShell
      title={`Detalle del dataset ${dataset.displayYear}`}
      description="Metadatos, encabezados detectados, reglas registradas y vistas previas de la base cargada."
      sidebarContext={{
        eyebrow: "Detalle de dataset",
        title: `Dataset ${dataset.displayYear}`,
        description: "Columnas, reglas, problemas y previews del archivo cargado.",
        badge: dataset.status,
      }}
    >
      <div className="flex min-h-full flex-col">
        <div className="mb-6">
          <DatasetExportPanel dataset={dataset} />
        </div>
        <div className="grid items-stretch gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <DatasetColumnsTable columns={dataset.columns.slice(0, 24)} />
          <CleaningRulesList rules={dataset.cleaningRulesApplied} />
        </div>
        <div className="mt-6 grid items-stretch gap-6 xl:grid-cols-2">
          <DatasetPreviewTable title="Preview original" preview={dataset.previewBefore} />
          <DatasetPreviewTable title="Preview base del sistema" preview={dataset.previewAfter} />
        </div>
        <div className="mt-6">
          <IssueList issues={dataset.issues} />
        </div>
      </div>
    </AppShell>
  );
}

import AppShell from "@/components/layout/app-shell";
import DatasetsIndexedDbPage from "@/components/datasets/datasets-indexeddb-page";

export const dynamic = "force-dynamic";

export default function DatasetsPage() {
  return (
    <AppShell
      title="Gestion de datasets"
      description="Panel administrativo para revisar archivos cargados, estado de procesamiento, Ano detectado, volumen y acceso al detalle."
      sidebarContext={{
        eyebrow: "Panel administrativo",
        title: "Gestion de datasets",
        description: "Revisa archivos cargados, estado, volumen y acceso al detalle.",
        actionLabel: "Subir CSV",
        actionHref: "/datasets/nuevo",
      }}
    >
      <DatasetsIndexedDbPage />
    </AppShell>
  );
}


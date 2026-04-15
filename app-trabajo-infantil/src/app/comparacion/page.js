import AppShell from "@/components/layout/app-shell";
import ComparisonIndexedDbPage from "@/components/comparison/comparison-indexeddb-page";

export const dynamic = "force-dynamic";

export default function ComparisonPage() {
  return (
    <AppShell
      title="Comparacion anual"
      description="Comparacion real entre anos limpios disponibles en el almacenamiento local."
      sidebarContext={{
        eyebrow: "Analisis anual",
        title: "Comparacion anual",
        description: "Compara indicadores y distribucion por edad entre anos limpios y validados.",
        badge: "Comparacion local",
      }}
    >
      <ComparisonIndexedDbPage />
    </AppShell>
  );
}


"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Card from "@/components/ui/card";
import DatasetTable from "@/components/datasets/dataset-table";
import DatasetUploadForm from "@/components/datasets/dataset-upload-form";
import DatasetStatusList from "@/components/datasets/dataset-status-list";
import { buildDatasetStatusSummary } from "@/lib/analytics/summary-service";
import { ensureClientBootstrap } from "@/lib/indexeddb/bootstrap";
import { listDatasetsLocal } from "@/lib/indexeddb/repository";

export default function DatasetsIndexedDbPage() {
  const [bootstrapStatus, setBootstrapStatus] = useState("loading");
  const [bootstrapError, setBootstrapError] = useState("");

  useEffect(() => {
    let isMounted = true;

    ensureClientBootstrap()
      .then(() => {
        if (!isMounted) return;
        setBootstrapStatus("ready");
      })
      .catch((error) => {
        if (!isMounted) return;
        setBootstrapStatus("error");
        setBootstrapError(error?.message || "No se pudo inicializar el almacenamiento local.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const datasets = useLiveQuery(
    async () => {
      if (bootstrapStatus !== "ready") return [];
      return listDatasetsLocal();
    },
    [bootstrapStatus],
    []
  );

  const statusSummary = useMemo(() => buildDatasetStatusSummary(datasets || []), [datasets]);

  if (bootstrapStatus === "error") {
    return (
      <Card
        title="Error de almacenamiento local"
        subtitle="No fue posible cargar IndexedDB. Revisa permisos del navegador e intenta recargar."
      >
        <p className="text-sm text-rose-700">{bootstrapError}</p>
      </Card>
    );
  }

  if (bootstrapStatus === "loading") {
    return (
      <Card
        title="Preparando datasets locales"
        subtitle="Inicializando IndexedDB y verificando dataset base 2024."
      >
        <p className="text-sm text-muted">Cargando almacenamiento local...</p>
      </Card>
    );
  }

  return (
    <div className="flex min-h-full min-w-0 flex-col gap-5 sm:gap-6">
      <DatasetStatusList statusSummary={statusSummary} />
      <DatasetUploadForm />
      <div className="min-h-0 min-w-0 flex-1">
        <DatasetTable datasets={datasets || []} />
      </div>
    </div>
  );
}


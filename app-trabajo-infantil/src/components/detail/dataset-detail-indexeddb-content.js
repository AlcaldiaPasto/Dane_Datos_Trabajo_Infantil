"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import DatasetColumnsTable from "@/components/detail/dataset-columns-table";
import DatasetPreviewTable from "@/components/detail/dataset-preview-table";
import CleaningRulesList from "@/components/detail/cleaning-rules-list";
import IssueList from "@/components/detail/issue-list";
import DatasetExportPanel from "@/components/datasets/dataset-export-panel";
import Card from "@/components/ui/card";
import { ensureClientBootstrap } from "@/lib/indexeddb/bootstrap";
import { getDatasetDetailLocal } from "@/lib/indexeddb/repository";

export default function DatasetDetailIndexedDbContent({ datasetId }) {
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
        setBootstrapError(error?.message || "No se pudo inicializar IndexedDB.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const dataset = useLiveQuery(
    async () => {
      if (bootstrapStatus !== "ready") return null;
      return getDatasetDetailLocal(datasetId);
    },
    [bootstrapStatus, datasetId],
    null
  );

  if (bootstrapStatus === "error") {
    return (
      <Card
        title="Error de almacenamiento local"
        subtitle="No fue posible leer el dataset desde IndexedDB."
      >
        <p className="text-sm text-rose-700">{bootstrapError}</p>
      </Card>
    );
  }

  if (bootstrapStatus === "loading") {
    return (
      <Card title="Cargando detalle del dataset" subtitle="Leyendo informacion local desde IndexedDB.">
        <p className="text-sm text-muted">Espera un momento...</p>
      </Card>
    );
  }

  if (!dataset) {
    return (
      <Card
        title="Dataset no encontrado"
        subtitle="No existe un dataset con ese identificador en el almacenamiento local."
      >
        <div className="flex">
          <Link
            href="/datasets"
            className="inline-flex items-center justify-center rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent hover:bg-accent-soft"
          >
            Volver a datasets
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <div className="mb-6">
        <DatasetExportPanel dataset={dataset} />
      </div>
      <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <DatasetColumnsTable columns={(dataset.columns || []).slice(0, 24)} />
        <CleaningRulesList rules={dataset.cleaningRulesApplied || []} />
      </div>
      <div className="mt-5 grid min-w-0 items-stretch gap-5 xl:grid-cols-2">
        <DatasetPreviewTable title="Preview original" preview={dataset.previewBefore} />
        <DatasetPreviewTable title="Preview base del sistema" preview={dataset.previewAfter} />
      </div>
      <div className="mt-5 min-w-0">
        <IssueList issues={dataset.issues || []} />
      </div>
    </div>
  );
}


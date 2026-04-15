"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import DashboardClient from "@/components/dashboard/dashboard-client";
import Card from "@/components/ui/card";
import { ensureClientBootstrap } from "@/lib/indexeddb/bootstrap";
import { listCleanDatasetsLocal } from "@/lib/indexeddb/repository";
import { buildDashboardRecordsFromLocalDatasets } from "@/lib/indexeddb/dashboard-records";

export default function DashboardIndexedDbPage() {
  const [bootstrapStatus, setBootstrapStatus] = useState("loading");
  const [bootstrapError, setBootstrapError] = useState("");

  useEffect(() => {
    let mounted = true;
    ensureClientBootstrap()
      .then(() => {
        if (!mounted) return;
        setBootstrapStatus("ready");
      })
      .catch((error) => {
        if (!mounted) return;
        setBootstrapStatus("error");
        setBootstrapError(error?.message || "No se pudo inicializar almacenamiento local.");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const cleanDatasets = useLiveQuery(
    async () => {
      if (bootstrapStatus !== "ready") return [];
      return listCleanDatasetsLocal();
    },
    [bootstrapStatus],
    []
  );

  const records = useMemo(
    () => buildDashboardRecordsFromLocalDatasets(cleanDatasets || []),
    [cleanDatasets]
  );

  if (bootstrapStatus === "error") {
    return (
      <Card title="Error de almacenamiento local" subtitle="No fue posible cargar datasets desde IndexedDB.">
        <p className="text-sm text-rose-700">{bootstrapError}</p>
      </Card>
    );
  }

  if (bootstrapStatus === "loading") {
    return (
      <Card title="Cargando dashboard local" subtitle="Preparando dataset base y datos de sesion desde IndexedDB.">
        <p className="text-sm text-muted">Espera un momento...</p>
      </Card>
    );
  }

  return <DashboardClient records={records} />;
}


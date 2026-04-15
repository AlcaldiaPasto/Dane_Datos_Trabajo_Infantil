"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import ProcessProgress from "@/components/process/process-progress";
import ProcessTimeline from "@/components/process/process-timeline";
import EmptyState from "@/components/ui/empty-state";
import Card from "@/components/ui/card";
import { ensureClientBootstrap } from "@/lib/indexeddb/bootstrap";
import { getCurrentProcessesLocal } from "@/lib/indexeddb/processes";

export default function ProcessesIndexedDbPage() {
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

  const processes = useLiveQuery(
    async () => {
      if (bootstrapStatus !== "ready") return [];
      return getCurrentProcessesLocal();
    },
    [bootstrapStatus],
    []
  );

  if (bootstrapStatus === "error") {
    return (
      <Card title="Error de almacenamiento local" subtitle="No fue posible cargar el estado de procesos en IndexedDB.">
        <p className="text-sm text-rose-700">{bootstrapError}</p>
      </Card>
    );
  }

  if (bootstrapStatus === "loading") {
    return (
      <Card title="Cargando procesos locales" subtitle="Leyendo bitacora de procesamiento desde IndexedDB.">
        <p className="text-sm text-muted">Espera un momento...</p>
      </Card>
    );
  }

  if (!processes?.length) {
    return (
      <EmptyState
        title="Sin procesos registrados"
        description="Aun no hay procesos en almacenamiento local. Sube un CSV para iniciar validacion y limpieza."
      />
    );
  }

  return (
    <div className="flex min-h-full min-w-0 items-start justify-center py-2 sm:py-4">
      <div className="flex w-full max-w-[900px] min-w-0 flex-col gap-5 sm:gap-6">
        {processes.map((process) => (
          <div key={process.datasetId} className="flex flex-col gap-6">
            <ProcessProgress process={process} />
            <ProcessTimeline steps={process.steps} />
          </div>
        ))}
      </div>
    </div>
  );
}


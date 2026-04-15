"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { reprocessLocalDatasetById } from "@/lib/indexeddb/client-upload-service";
import { deleteDatasetLocal } from "@/lib/indexeddb/repository";

export default function DatasetActions({ dataset }) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const canMutate = !dataset.isPrimary && dataset.sourceType === "upload";

  async function handleDeleteLocal() {
    const confirmed = window.confirm(
      `Eliminar el dataset ${dataset.fileName}? Esta accion borra la copia local del navegador.`
    );
    if (!confirmed) return;

    setIsBusy(true);
    try {
      await deleteDatasetLocal(dataset.id);
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function handleReprocessLocal() {
    setIsBusy(true);
    try {
      const result = await reprocessLocalDatasetById(dataset.id);
      if (!result.ok) {
        window.alert(result.error || "No fue posible reprocesar el dataset local.");
      }
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      <Link
        href={`/datasets/${dataset.id}`}
        className="inline-flex items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent-soft"
      >
        Ver detalle
      </Link>

      {canMutate ? (
        <>
          <button
            type="button"
            onClick={handleReprocessLocal}
            disabled={isBusy}
            className="inline-flex items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reprocesar local
          </button>
          <button
            type="button"
            onClick={handleDeleteLocal}
            disabled={isBusy}
            className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Eliminar local
          </button>
        </>
      ) : null}
    </div>
  );
}


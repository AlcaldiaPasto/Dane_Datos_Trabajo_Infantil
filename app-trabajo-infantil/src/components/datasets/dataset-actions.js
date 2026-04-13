"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DatasetActions({ dataset }) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const canMutate = !dataset.isPrimary && dataset.sourceType === "upload";

  async function reprocessDataset() {
    setIsBusy(true);
    try {
      const response = await fetch(`/api/datasets/${dataset.id}/reprocess`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data.error || "No fue posible reprocesar el dataset.");
      }
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteDataset() {
    const confirmed = window.confirm(`Eliminar el dataset ${dataset.fileName}? Esta accion solo afecta la sesion local.`);
    if (!confirmed) return;

    setIsBusy(true);
    try {
      const response = await fetch(`/api/datasets/${dataset.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data.error || "No fue posible eliminar el dataset.");
      }
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/datasets/${dataset.id}`}
        className="inline-flex rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent-soft"
      >
        Ver detalle
      </Link>
      {canMutate ? (
        <>
          <button
            type="button"
            onClick={reprocessDataset}
            disabled={isBusy}
            className="inline-flex rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reprocesar
          </button>
          <button
            type="button"
            onClick={deleteDataset}
            disabled={isBusy}
            className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Eliminar
          </button>
        </>
      ) : null}
    </div>
  );
}

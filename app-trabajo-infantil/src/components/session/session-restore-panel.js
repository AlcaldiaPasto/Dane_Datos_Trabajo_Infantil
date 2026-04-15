"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/card";
import { restoreLocalSessionFromZipFile } from "@/lib/indexeddb/session-bundle";

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "N/D";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function SessionRestorePanel() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);

  const canSubmit = useMemo(() => file && status !== "uploading", [file, status]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) return;

    setStatus("uploading");
    setMessage("Restaurando sesion local desde ZIP...");
    setResult(null);

    try {
      const payload = await restoreLocalSessionFromZipFile(file);
      setStatus("success");
      setResult(payload);
      setMessage(payload.message || "Sesion restaurada correctamente.");
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "No fue posible restaurar la sesion local.");
    }
  }

  return (
    <div className="grid w-full max-w-5xl gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Card
        title="Restaurar sesion desde ZIP"
        subtitle="Carga un ZIP exportado previamente para recuperar datasets procesados, metadatos y estado local."
        interactive
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center">
            <span className="text-xl font-semibold text-foreground">Seleccionar ZIP de sesion</span>
            <p className="mt-2 text-sm text-muted">Debe ser un archivo generado desde &quot;Descargar ZIP de sesion&quot;.</p>
            <input
              type="file"
              accept=".zip,application/zip"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="sr-only"
            />
          </label>

          <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">Archivo seleccionado</p>
            <p className="mt-2 font-semibold text-foreground">{file?.name || "Sin archivo seleccionado"}</p>
            <p className="mt-1 text-muted">Tamano: {formatFileSize(file?.size)}</p>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              "inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold transition",
              canSubmit ? "bg-slate-950 text-white hover:bg-slate-800" : "cursor-not-allowed bg-slate-200 text-slate-500",
            ].join(" ")}
          >
            {status === "uploading" ? "Restaurando..." : "Restaurar sesion"}
          </button>
        </form>
      </Card>

      <Card
        title="Resultado de restauracion"
        subtitle="Al restaurar, se reemplaza la sesion local actual por la informacion del ZIP cargado."
        interactive
      >
        <div className="space-y-3">
          <div className="rounded-2xl border border-line bg-surface px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">Estado</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {status === "idle" && "Esperando archivo"}
              {status === "uploading" && "Procesando restauracion"}
              {status === "success" && "Sesion restaurada"}
              {status === "error" && "Error en restauracion"}
            </p>
            <p className="mt-1 text-sm text-muted">{message || "Carga un ZIP para iniciar."}</p>
          </div>

          {result ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-white px-4 py-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">Bloques restaurados</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{result.restoredFiles}</p>
              </div>
              <div className="rounded-2xl border border-line bg-white px-4 py-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">Datasets detectados</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{result.restoredDatasets}</p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/datasets"
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-line bg-white text-sm font-semibold text-foreground transition hover:border-accent hover:bg-accent-soft"
            >
              Ir a datasets
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-line bg-white text-sm font-semibold text-foreground transition hover:border-accent hover:bg-accent-soft"
            >
              Ir al dashboard
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

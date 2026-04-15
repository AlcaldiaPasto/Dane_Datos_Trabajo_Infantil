"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/card";
import StatusPill from "@/components/ui/status-pill";
import { ingestLocalDatasetFile } from "@/lib/indexeddb/client-upload-service";

function formatFileSize(size) {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function detectYearFromName(fileName) {
  const match = String(fileName || "").match(/20\d{2}/);
  return match ? match[0] : "No identificado";
}

function isAcceptedFile(fileName) {
  const lower = String(fileName || "").toLowerCase();
  return lower.endsWith(".csv") || lower.endsWith(".zip");
}

export default function CsvUploadPanel() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const validation = useMemo(() => {
    if (!file) {
      return {
        tone: "pending",
        message: "Selecciona un archivo CSV o ZIP para iniciar la validacion.",
      };
    }

    if (!isAcceptedFile(file.name)) {
      return {
        tone: "error",
        message: "El archivo seleccionado no tiene extension .csv o .zip.",
      };
    }

    return {
      tone: "clean",
      message: file.name.toLowerCase().endsWith(".zip")
        ? "ZIP valido. Se buscara un CSV en cualquier carpeta del ZIP."
        : "CSV valido. Se validara estructura y se filtrara Pasto en procesamiento local.",
    };
  }, [file]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!file) {
      setError("Selecciona un archivo CSV o ZIP antes de procesar.");
      return;
    }

    if (!isAcceptedFile(file.name)) {
      setError("El archivo debe tener extension .csv o .zip.");
      return;
    }

    setIsUploading(true);
    try {
      const data = await ingestLocalDatasetFile(file);
      if (!data?.dataset) {
        setError(data?.error || "No fue posible procesar el archivo local.");
        return;
      }

      setResult(data);
    } catch (caughtError) {
      setError(caughtError?.message || "Ocurrio un error inesperado al procesar el archivo.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[900px] min-w-0 flex-col gap-5 sm:gap-6">
      <Card
        title="Ingresar nuevo CSV o ZIP"
        subtitle="Sube un archivo del DANE para validarlo, procesarlo y guardarlo en IndexedDB del navegador actual."
        interactive
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block rounded-[28px] border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-accent hover:bg-accent-soft/40 sm:px-6 sm:py-10">
            <input
              type="file"
              accept=".csv,.zip,text/csv,application/zip,application/x-zip-compressed"
              className="sr-only"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setResult(null);
                setError("");
              }}
            />
            <span className="text-lg font-semibold text-foreground">Seleccionar archivo CSV o ZIP</span>
            <span className="mt-3 block text-sm leading-6 text-muted">
              Los datos se guardan en el navegador actual. Si subes ZIP, se detecta automaticamente un CSV interno.
            </span>
          </label>

          <div className="rounded-[24px] border border-line bg-white px-5 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-muted">Validacion inicial</p>
                <p className="mt-2 text-sm leading-6 text-muted">{validation.message}</p>
              </div>
              <StatusPill status={validation.tone} />
            </div>
          </div>

          {error ? (
            <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-6 text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!file || isUploading}
            className="w-full rounded-2xl bg-accent px-5 py-4 text-sm font-bold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {isUploading ? "Procesando archivo..." : "Subir y procesar archivo"}
          </button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card title="Resumen del archivo" subtitle="Informacion local detectada antes de guardar en IndexedDB.">
          <dl className="grid items-stretch gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-line bg-surface px-5 py-5">
              <dt className="font-mono text-[11px] uppercase tracking-[0.26em] text-muted">Nombre</dt>
              <dd className="mt-3 break-all text-sm font-semibold text-foreground">
                {file?.name || "Sin archivo seleccionado"}
              </dd>
            </div>
            <div className="rounded-[24px] border border-line bg-surface px-5 py-5">
              <dt className="font-mono text-[11px] uppercase tracking-[0.26em] text-muted">Tamano</dt>
              <dd className="mt-3 text-sm font-semibold text-foreground">{file ? formatFileSize(file.size) : "N/D"}</dd>
            </div>
            <div className="rounded-[24px] border border-line bg-surface px-5 py-5">
              <dt className="font-mono text-[11px] uppercase tracking-[0.26em] text-muted">Ano detectado</dt>
              <dd className="mt-3 text-sm font-semibold text-foreground">
                {file ? detectYearFromName(file.name) : "N/D"}
              </dd>
            </div>
            <div className="rounded-[24px] border border-line bg-surface px-5 py-5">
              <dt className="font-mono text-[11px] uppercase tracking-[0.26em] text-muted">Estado esperado</dt>
              <dd className="mt-3 text-sm font-semibold text-foreground">
                {file ? "Pendiente de validacion estructural" : "Pendiente"}
              </dd>
            </div>
          </dl>
        </Card>

        {result?.dataset ? (
          <Card
            title="Resultado del procesamiento"
            subtitle="El dataset quedo registrado en IndexedDB y aparece en el listado local."
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-4 rounded-[24px] border border-line bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-all text-sm font-semibold text-foreground">{result.dataset.fileName}</p>
                  <p className="mt-1 text-sm text-muted">
                    Estado: {result.dataset.status} - Ano: {result.dataset.detectedYear || "No identificado"} -
                    Filas Pasto: {result.dataset.rowCount}
                  </p>
                </div>
                <StatusPill status={result.dataset.status} />
              </div>

              {result.issues?.length ? (
                <ul className="space-y-2 text-sm leading-6 text-amber-700">
                  {result.issues.map((issue) => (
                    <li key={issue} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                      {issue}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Archivo guardado en almacenamiento local del navegador actual.
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => router.push("/datasets")}
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-slate-50"
                >
                  Ver listado
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/procesos")}
                  className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  Ver procesos
                </button>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}


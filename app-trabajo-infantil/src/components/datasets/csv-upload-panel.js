"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/card";
import StatusPill from "@/components/ui/status-pill";

function formatFileSize(size) {
  if (!size) {
    return "0 KB";
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function detectYearFromName(fileName) {
  const match = String(fileName || "").match(/20\d{2}/);
  return match ? match[0] : "No identificado";
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
        message: "Selecciona un archivo CSV para iniciar la validacion.",
      };
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return {
        tone: "error",
        message: "El archivo seleccionado no tiene extension .csv.",
      };
    }

    return {
      tone: "clean",
      message: "Extension valida. La estructura se validara al subir el archivo.",
    };
  }, [file]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!file) {
      setError("Selecciona un archivo CSV antes de procesar.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);

    try {
      const response = await fetch("/api/datasets", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!data.dataset) {
        setError(data.error || "No fue posible procesar el archivo.");
        return;
      }

      setResult(data);
      router.refresh();
    } catch {
      setError("Ocurrio un error inesperado al subir el archivo.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-6">
      <Card
        title="Ingresar nuevo CSV"
        subtitle="Sube un archivo del DANE para validarlo, registrar su ano y dejarlo disponible en el listado de datasets."
        interactive
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block rounded-[28px] border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-accent hover:bg-accent-soft/40">
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setResult(null);
                setError("");
              }}
            />
            <span className="text-lg font-semibold text-foreground">Seleccionar archivo CSV</span>
            <span className="mt-3 block text-sm leading-6 text-muted">
              El archivo original no se modifica. Se guarda una copia temporal en la sesion.
            </span>
          </label>

          <div className="rounded-[24px] border border-line bg-white px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-muted">
                  Validacion inicial
                </p>
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
            {isUploading ? "Procesando archivo..." : "Subir y procesar CSV"}
          </button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card title="Resumen del archivo" subtitle="Informacion local detectada antes de enviar el CSV al servidor.">
          <dl className="grid items-stretch gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-line bg-surface px-5 py-5">
              <dt className="font-mono text-[11px] uppercase tracking-[0.26em] text-muted">
                Nombre
              </dt>
              <dd className="mt-3 break-all text-sm font-semibold text-foreground">
                {file?.name || "Sin archivo seleccionado"}
              </dd>
            </div>
            <div className="rounded-[24px] border border-line bg-surface px-5 py-5">
              <dt className="font-mono text-[11px] uppercase tracking-[0.26em] text-muted">
                Tamano
              </dt>
              <dd className="mt-3 text-sm font-semibold text-foreground">
                {file ? formatFileSize(file.size) : "N/D"}
              </dd>
            </div>
            <div className="rounded-[24px] border border-line bg-surface px-5 py-5">
              <dt className="font-mono text-[11px] uppercase tracking-[0.26em] text-muted">
                Ano detectado
              </dt>
              <dd className="mt-3 text-sm font-semibold text-foreground">
                {file ? detectYearFromName(file.name) : "N/D"}
              </dd>
            </div>
            <div className="rounded-[24px] border border-line bg-surface px-5 py-5">
              <dt className="font-mono text-[11px] uppercase tracking-[0.26em] text-muted">
                Estado esperado
              </dt>
              <dd className="mt-3 text-sm font-semibold text-foreground">
                {file ? "Pendiente de validacion estructural" : "Pendiente"}
              </dd>
            </div>
          </dl>
        </Card>

        {result?.dataset ? (
          <Card title="Resultado del procesamiento" subtitle="El dataset ya quedo registrado en la sesion y aparecera en el listado.">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-[24px] border border-line bg-surface px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{result.dataset.fileName}</p>
                  <p className="mt-1 text-sm text-muted">
                    Ano: {result.dataset.detectedYear || "No identificado"} - Filas: {result.dataset.rowCount} - Columnas: {result.dataset.columnCount}
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
                  Archivo validado correctamente. Puedes abrirlo desde el listado de datasets.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/datasets")}
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-slate-50"
                >
                  Ver listado
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/datasets/${result.dataset.id}`)}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Abrir detalle
                </button>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

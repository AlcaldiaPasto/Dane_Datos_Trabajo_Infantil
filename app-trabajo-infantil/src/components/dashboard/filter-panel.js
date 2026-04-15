"use client";

import { ALL_FILTER_VALUE } from "@/lib/analytics/dashboard-calculations";
import Card from "@/components/ui/card";

const selectClass =
  "mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-teal-100";

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-muted">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
        <option value={ALL_FILTER_VALUE}>Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ViewSwitcher({ page, onPageChange }) {
  if (typeof page !== "number" || !onPageChange) return null;

  const isFirstPage = page === 0;

  return (
    <div className="flex items-center justify-between rounded-[22px] border border-line bg-white px-4 py-3">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">Vista {page + 1} de 2</p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {isFirstPage ? "Graficas principales" : "Detalle analitico"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onPageChange(isFirstPage ? 1 : 0)}
        className="inline-flex h-9 min-w-[108px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
      >
        {isFirstPage ? (
          <>
            Siguiente <span aria-hidden="true">{"->"}</span>
          </>
        ) : (
          <>
            <span aria-hidden="true">{"<-"}</span> Volver
          </>
        )}
      </button>
    </div>
  );
}

export default function FilterPanel({
  filters,
  options,
  onChange,
  onReset,
  filteredTotal,
  page,
  onPageChange,
  onExportJson,
  onExportCsv,
}) {
  return (
    <Card
      title="Panel de filtros"
      subtitle="Filtros conectados al estado del dashboard. Cada cambio recalcula KPI, graficas y tabla resumen."
      interactive
      className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] p-4"
    >
      <div className="space-y-4">
        <ViewSwitcher page={page} onPageChange={onPageChange} />

        <div className="rounded-[22px] border border-line bg-slate-950 px-5 py-3 text-white">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/60">Registros filtrados</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold tracking-tight">{filteredTotal}</p>
              <p className="mt-1 text-sm text-white/65">Base activa: {filters.year}</p>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/20"
            >
              Limpiar
            </button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex h-9 items-center justify-center rounded-full bg-white/10 px-3 text-xs font-bold text-white/85 transition hover:bg-white/20"
            >
              Resumen JSON
            </button>
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex h-9 items-center justify-center rounded-full bg-white/10 px-3 text-xs font-bold text-white/85 transition hover:bg-white/20"
            >
              Tabla CSV
            </button>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <FilterSelect label="Año" value={filters.year} options={options.years} onChange={(value) => onChange("year", value)} />
          <FilterSelect label="Sexo" value={filters.sex} options={options.sex} onChange={(value) => onChange("sex", value)} />
          <FilterSelect label="Edad" value={filters.age} options={options.ages} onChange={(value) => onChange("age", value)} />
          <FilterSelect
            label="Trabaja"
            value={filters.works}
            options={options.works}
            onChange={(value) => onChange("works", value)}
          />
          <FilterSelect
            label="Estudia"
            value={filters.studies}
            options={options.studies}
            onChange={(value) => onChange("studies", value)}
          />
          <FilterSelect
            label="Riesgo final"
            value={filters.riskFinal}
            options={options.riskFinal}
            onChange={(value) => onChange("riskFinal", value)}
          />
        </div>
      </div>
    </Card>
  );
}

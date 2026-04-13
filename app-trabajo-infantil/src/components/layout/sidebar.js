"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Dashboard", shortLabel: "01", match: "exact" },
  { href: "/datasets", label: "Datasets", shortLabel: "02", match: "datasets" },
  { href: "/datasets/nuevo", label: "Subir CSV", shortLabel: "03", match: "upload" },
  { href: "/comparacion", label: "Comparacion anual", shortLabel: "04", match: "prefix" },
  { href: "/procesos", label: "Procesos", shortLabel: "05", match: "prefix" },
];

function isItemActive(item, pathname) {
  if (item.match === "exact") {
    return pathname === item.href;
  }

  if (item.match === "upload") {
    return pathname === "/datasets/nuevo";
  }

  if (item.match === "datasets") {
    return pathname === "/datasets" || (pathname.startsWith("/datasets/") && pathname !== "/datasets/nuevo");
  }

  return pathname.startsWith(item.href);
}

function getItemClass(isActive) {
  return [
    "group flex h-12 items-center justify-between rounded-2xl border px-4 transition",
    isActive
      ? "border-accent bg-accent text-white shadow-lg shadow-teal-900/15"
      : "border-line bg-surface-strong text-foreground hover:border-accent/40 hover:bg-white",
  ].join(" ");
}

export default function Sidebar({ context }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col overflow-hidden border-r border-line bg-[rgba(255,255,255,0.86)] px-5 py-5 backdrop-blur">
      <div className="mb-4 h-[154px] shrink-0 rounded-3xl border border-line bg-surface-strong px-5 py-5 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">DANE</p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-foreground">Trabajo infantil</h1>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
          Flujo: subir CSV, validar, listar, abrir detalle y comparar anos.
        </p>
      </div>

      {context ? (
        <div className="mb-4 h-[194px] shrink-0 rounded-3xl border border-line bg-slate-950 px-5 py-4 text-white shadow-sm">
          <p className="h-4 truncate font-mono text-[11px] uppercase tracking-[0.28em] text-white/55">
            {context.eyebrow}
          </p>
          <h2 className="mt-2 line-clamp-1 text-lg font-semibold leading-tight">{context.title}</h2>
          <p className="mt-2 h-12 overflow-hidden text-sm leading-6 text-white/65">{context.description}</p>
          <div className="mt-4 h-10">
            {context.actionHref && context.actionLabel ? (
              <Link
                href={context.actionHref}
                className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-accent px-4 text-sm font-bold text-white transition hover:bg-teal-700"
              >
                {context.actionLabel}
              </Link>
            ) : context.badge ? (
              <div className="inline-flex h-10 max-w-full items-center rounded-full bg-white/10 px-4 font-mono text-[11px] uppercase tracking-[0.22em] text-white/80">
                <span className="truncate">{context.badge}</span>
              </div>
            ) : (
              <div className="h-10" />
            )}
          </div>
        </div>
      ) : null}

      <nav className="flex shrink-0 flex-col gap-3">
        {items.map((item) => {
          const isActive = isItemActive(item, pathname);

          return (
            <Link key={item.href} href={item.href} className={getItemClass(isActive)}>
              <span className="text-sm font-semibold">{item.label}</span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto h-[126px] shrink-0 rounded-3xl border border-line bg-surface px-4 py-4">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Sesion</p>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
          Sin base de datos persistente. Los datasets cargados se guardan temporalmente en la sesion.
        </p>
      </div>
    </aside>
  );
}

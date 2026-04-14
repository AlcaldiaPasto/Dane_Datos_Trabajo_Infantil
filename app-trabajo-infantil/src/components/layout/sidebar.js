"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
  { href: "/", label: "Dashboard", shortLabel: "01", icon: "dashboard", match: "exact" },
  { href: "/datasets", label: "Datasets", shortLabel: "02", icon: "datasets", match: "datasets" },
  { href: "/datasets/nuevo", label: "Subir CSV", shortLabel: "03", icon: "upload", match: "upload" },
  { href: "/comparacion", label: "Comparacion anual", shortLabel: "04", icon: "compare", match: "prefix" },
  { href: "/procesos", label: "Procesos", shortLabel: "05", icon: "process", match: "prefix" },
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

function getItemClass(isActive, isOpen) {
  return [
    "group flex h-11 min-w-0 shrink-0 items-center gap-3 rounded-2xl border transition",
    isOpen ? "justify-between px-4" : "justify-center px-0",
    isActive
      ? "border-accent bg-accent text-white shadow-lg shadow-teal-900/15"
      : "border-line bg-surface-strong text-foreground hover:border-accent/40 hover:bg-white",
  ].join(" ");
}

function MenuIcon({ name, className = "h-5 w-5" }) {
  const commonProps = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (name === "dashboard") {
    return (
      <svg {...commonProps}>
        <path d="M4 5.5a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 11 5.5v4A1.5 1.5 0 0 1 9.5 11h-4A1.5 1.5 0 0 1 4 9.5z" />
        <path d="M13 5.5A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 13 9.5z" />
        <path d="M4 14.5A1.5 1.5 0 0 1 5.5 13h4a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 9.5 20h-4A1.5 1.5 0 0 1 4 18.5z" />
        <path d="M13 14.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5z" />
      </svg>
    );
  }

  if (name === "datasets") {
    return (
      <svg {...commonProps}>
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h3.3l2 2H18a2 2 0 0 1 2 2v.5" />
        <path d="M4.5 9h15l-1.3 9.1A2.2 2.2 0 0 1 16 20H8a2.2 2.2 0 0 1-2.2-1.9z" />
      </svg>
    );
  }

  if (name === "upload") {
    return (
      <svg {...commonProps}>
        <path d="M12 16V5" />
        <path d="m7.5 9.5 4.5-4.5 4.5 4.5" />
        <path d="M5 16.5v1A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-1" />
      </svg>
    );
  }

  if (name === "compare") {
    return (
      <svg {...commonProps}>
        <path d="M5 19V9" />
        <path d="M12 19V5" />
        <path d="M19 19v-7" />
        <path d="M4 19h16" />
      </svg>
    );
  }

  if (name === "process") {
    return (
      <svg {...commonProps}>
        <path d="M12 21a9 9 0 1 0-8.1-5.1" />
        <path d="M4 21v-5h5" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function ChevronIcon({ isOpen }) {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={isOpen ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

function MenuToggle({ isOpen, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Cerrar menu" : "Abrir menu"}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-white text-foreground shadow-sm transition hover:border-accent hover:bg-accent-soft"
    >
      <ChevronIcon isOpen={isOpen} />
    </button>
  );
}

export default function Sidebar({ context }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  function toggleMenu() {
    setIsOpen((currentValue) => !currentValue);
  }

  return (
    <aside
      className={[
        "relative top-auto flex w-full shrink-0 flex-col border-b border-line bg-[rgba(255,255,255,0.9)] backdrop-blur transition-all duration-300 lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0",
        isOpen
          ? "overflow-visible px-4 py-4 lg:w-72 lg:overflow-y-auto lg:overflow-x-hidden lg:px-5"
          : "overflow-hidden px-3 py-3 lg:w-20 lg:overflow-y-auto lg:overflow-x-hidden",
      ].join(" ")}
    >
      <div
        className={[
          "mb-3 flex shrink-0 items-start gap-3 rounded-3xl border border-line bg-surface-strong shadow-sm transition-all",
          isOpen ? "min-h-[164px] px-6 py-5 lg:min-h-[188px]" : "h-14 items-center px-3 py-2",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">DANE</p>
          {isOpen ? (
            <>
              <h1 className="mt-3 text-2xl font-semibold leading-tight text-foreground">Trabajo infantil</h1>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                Flujo: subir CSV, validar, listar, abrir detalle y comparar anos.
              </p>
              {context?.title ? (
                <p className="mt-4 inline-flex max-w-full rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                  <span className="truncate">{context.title}</span>
                </p>
              ) : null}
            </>
          ) : null}
        </div>
        <MenuToggle isOpen={isOpen} onClick={toggleMenu} />
      </div>

      <nav
        className={[
          "shrink-0 gap-2",
          isOpen ? "grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col" : "hidden lg:flex lg:flex-col",
        ].join(" ")}
      >
        {items.map((item) => {
          const isActive = isItemActive(item, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
              className={getItemClass(isActive, isOpen)}
            >
              <span className={isOpen ? "flex min-w-0 items-center gap-3" : "flex items-center justify-center"}>
                <MenuIcon name={item.icon} />
                {isOpen ? <span className="truncate text-sm font-semibold">{item.label}</span> : null}
              </span>
              {isOpen ? (
                <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">{item.shortLabel}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {isOpen ? (
        <div className="mt-3 hidden h-[104px] shrink-0 rounded-3xl border border-line bg-surface px-4 py-3 lg:mt-auto lg:block">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Sesion</p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
            Sin base de datos persistente. Los datasets cargados se guardan temporalmente en la sesion.
          </p>
        </div>
      ) : null}
    </aside>
  );
}

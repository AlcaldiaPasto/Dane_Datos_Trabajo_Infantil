"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const items = [
  { href: "/", label: "Dashboard", shortLabel: "01", icon: "dashboard", match: "exact" },
  { href: "/datasets", label: "Datasets", shortLabel: "02", icon: "datasets", match: "datasets" },
  { href: "/datasets/nuevo", label: "Subir CSV", shortLabel: "03", icon: "upload", match: "upload" },
  { href: "/comparacion", label: "Comparacion anual", shortLabel: "04", icon: "compare", match: "prefix" },
  { href: "/procesos", label: "Procesos", shortLabel: "05", icon: "process", match: "prefix" },
  { href: "/sesion/restaurar", label: "Restaurar ZIP", shortLabel: "06", icon: "restore", match: "prefix" },
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

function getItemClass(isActive, isExpanded) {
  return [
    "group flex h-11 min-w-0 shrink-0 items-center gap-3 rounded-2xl border transition",
    isExpanded
      ? "justify-between px-4"
      : "justify-center px-0 text-foreground [&_svg]:h-6 [&_svg]:w-6 [&_svg]:stroke-[2]",
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

  if (name === "restore") {
    return (
      <svg {...commonProps}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M7 10l5 5 5-5" />
        <path d="M12 15V3" />
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

function MobileMenuIcon({ isOpen }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {isOpen ? (
        <>
          <path d="m7 7 10 10" />
          <path d="m17 7-10 10" />
        </>
      ) : (
        <>
          <path d="M5 7h14" />
          <path d="M5 12h14" />
          <path d="M5 17h14" />
        </>
      )}
    </svg>
  );
}

function MenuToggle({ isOpen, onClick, className = "", ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-label={ariaLabel || (isOpen ? "Cerrar menu" : "Abrir menu")}
      className={[
        "h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-white text-foreground shadow-sm transition hover:border-accent hover:bg-accent-soft",
        className,
      ].join(" ")}
    >
      <ChevronIcon isOpen={isOpen} />
    </button>
  );
}

export default function Sidebar({ context }) {
  const pathname = usePathname();
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const showExpanded = isMobileOpen || isDesktopOpen;

  function toggleDesktopMenu() {
    setIsDesktopOpen((currentValue) => !currentValue);
  }

  function toggleMobileMenu() {
    setIsMobileOpen((currentValue) => !currentValue);
  }

  function closeMobileMenu() {
    setIsMobileOpen(false);
  }

  useEffect(() => {
    if (!isMobileOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileOpen]);

  return (
    <>
      <button
        type="button"
        onClick={toggleMobileMenu}
        aria-expanded={isMobileOpen}
        aria-label={isMobileOpen ? "Cerrar menu" : "Abrir menu"}
        className={[
          "fixed right-4 top-4 z-[60] inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-white text-foreground shadow-lg transition hover:border-accent hover:bg-accent-soft lg:hidden",
        ].join(" ")}
      >
        <MobileMenuIcon isOpen={isMobileOpen} />
      </button>

      <button
        type="button"
        aria-hidden={!isMobileOpen}
        onClick={() => setIsMobileOpen(false)}
        className={[
          "fixed inset-0 z-40 bg-slate-900/30 transition-opacity lg:hidden",
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        className={[
          "fixed inset-y-0 right-0 z-50 flex w-[84vw] max-w-[360px] shrink-0 flex-col border-l border-line bg-[rgba(255,255,255,0.96)] px-4 py-4 shadow-2xl backdrop-blur transition-transform duration-300 overflow-y-auto",
          isMobileOpen ? "translate-x-0" : "translate-x-full",
          "lg:sticky lg:top-0 lg:inset-auto lg:z-auto lg:h-dvh lg:self-start lg:translate-x-0 lg:overflow-y-auto lg:border-l-0 lg:border-r lg:border-b-0 lg:bg-[rgba(255,255,255,0.9)] lg:shadow-none",
          showExpanded ? "lg:w-80 lg:px-5" : "lg:w-20 lg:px-3",
        ].join(" ")}
      >
        <div
          className={[
            "mb-3 flex shrink-0 items-start gap-3 rounded-3xl border border-line bg-surface-strong shadow-sm transition-all",
            showExpanded ? "min-h-[164px] px-6 py-5 lg:min-h-[188px]" : "h-14 items-center px-3 py-2",
          ].join(" ")}
        >
          {showExpanded ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">DANE</p>
                <h1 className="mt-3 text-2xl font-semibold leading-tight text-foreground">Trabajo infantil</h1>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Flujo: subir CSV, validar, listar, abrir detalle y comparar anos.
                </p>
                {context?.title ? (
                  <p className="mt-4 text-sm font-semibold leading-5 text-foreground">{context.title}</p>
                ) : null}
              </div>
              <MenuToggle
                isOpen={isDesktopOpen}
                onClick={toggleDesktopMenu}
                className="hidden lg:inline-flex"
                ariaLabel="Alternar menu de escritorio"
              />
            </>
          ) : (
            <div className="flex w-full items-center justify-center">
              <MenuToggle
                isOpen={isDesktopOpen}
                onClick={toggleDesktopMenu}
                className="hidden lg:inline-flex"
                ariaLabel="Alternar menu de escritorio"
              />
            </div>
          )}
        </div>

        <nav
          className={[
            "shrink-0 gap-2",
            showExpanded ? "flex flex-col" : "hidden lg:flex lg:flex-col",
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
                className={getItemClass(isActive, showExpanded)}
                onClick={closeMobileMenu}
              >
                <span
                  className={
                    showExpanded
                      ? "flex min-w-0 items-center gap-3"
                      : "inline-flex h-6 w-6 items-center justify-center text-current"
                  }
                >
                  <MenuIcon name={item.icon} className={showExpanded ? "h-5 w-5" : "h-6 w-6"} />
                  {showExpanded ? <span className="text-sm font-semibold leading-tight">{item.label}</span> : null}
                </span>
                {showExpanded ? (
                  <span className="hidden font-mono text-xs uppercase tracking-[0.2em] opacity-70 xl:inline">
                    {item.shortLabel}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {showExpanded ? (
          <div className="mt-3 hidden min-h-[104px] shrink-0 rounded-3xl border border-line bg-surface px-4 py-3 lg:mt-auto lg:block">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Sesion</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Los datasets se guardan localmente en este navegador usando IndexedDB.
            </p>
            <div className="mt-3 grid gap-2">
              <a
                href="/api/session/export"
                className="inline-flex h-9 items-center justify-center rounded-2xl bg-teal-700 px-3 text-xs font-bold !text-white shadow-sm transition hover:bg-teal-600"
              >
                Descargar ZIP de sesion
              </a>
              <Link
                href="/sesion/restaurar"
                onClick={closeMobileMenu}
                className="inline-flex h-9 items-center justify-center rounded-2xl border border-line bg-white px-3 text-xs font-bold text-foreground transition hover:border-accent hover:bg-accent-soft"
              >
                Cargar ZIP de sesion
              </Link>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}

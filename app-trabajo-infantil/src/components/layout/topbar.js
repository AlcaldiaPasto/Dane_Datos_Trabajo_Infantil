export default function Topbar({ title, description, actions, compact = false }) {
  return (
    <header
      className={`mx-auto flex w-full max-w-[1500px] flex-col border-b border-line lg:flex-row lg:items-end lg:justify-between ${
        compact ? "gap-3 pb-3" : "gap-4 pb-5"
      }`}
    >
      <div className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Panel operativo</p>
        <h2 className={`${compact ? "mt-1 text-2xl" : "mt-2 text-3xl"} font-semibold tracking-tight text-foreground`}>
          {title}
        </h2>
        <p className={`${compact ? "mt-1 leading-6" : "mt-3 leading-7"} max-w-3xl text-sm text-muted`}>
          {description}
        </p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </header>
  );
}

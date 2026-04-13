export default function Card({
  title,
  subtitle,
  className = "",
  children,
  interactive = false,
}) {
  const interactiveClasses = interactive
    ? "transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.10)]"
    : "";

  return (
    <section
      className={`flex min-w-0 flex-col rounded-[24px] border border-line bg-surface-strong p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ${interactiveClasses} ${className}`.trim()}
    >
      {title ? <h3 className="text-lg font-semibold text-foreground">{title}</h3> : null}
      {subtitle ? <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p> : null}
      <div className={title || subtitle ? "mt-4 min-h-0 min-w-0 flex-1" : "min-h-0 min-w-0 flex-1"}>
        {children}
      </div>
    </section>
  );
}

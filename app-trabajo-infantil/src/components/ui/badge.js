export default function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    accent: "bg-accent-soft text-accent",
    warning: "bg-amber-100 text-amber-800",
  };

  return <span className={`inline-flex rounded-full px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] ${tones[tone] || tones.neutral}`}>{children}</span>;
}

const tones = {
  pending: "bg-slate-100 text-slate-700",
  processing: "bg-amber-100 text-amber-800",
  clean: "bg-emerald-100 text-emerald-800",
  error: "bg-rose-100 text-rose-800",
};

export default function StatusPill({ status }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${tones[status] || tones.pending}`}>{status}</span>;
}

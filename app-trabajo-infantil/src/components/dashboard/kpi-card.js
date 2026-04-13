import Card from "@/components/ui/card";

const cardStyles = [
  "bg-[#a8d4ff] text-slate-950 border-[#4aa3ff]",
  "bg-[#a8d4ff] text-slate-950 border-[#4aa3ff]",
  "bg-[#a8d4ff] text-slate-950 border-[#4aa3ff]",
  "bg-[#a8d4ff] text-slate-950 border-[#4aa3ff]",
];

export default function KpiCard({ label, value, note, delta, index = 0, compact = false }) {
  return (
    <Card
      interactive
      className={`${compact ? "min-h-[102px] p-4" : "min-h-[132px]"} border-2 ${
        cardStyles[index % cardStyles.length]
      } shadow-[0_12px_28px_rgba(37,99,235,0.10)]`}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          <p className={`${compact ? "text-2xl" : "text-3xl"} font-semibold tracking-tight`}>{value}</p>
          <h3 className={`${compact ? "mt-1 text-sm" : "mt-2 text-base"} font-bold leading-tight`}>{label}</h3>
          <p className={`${compact ? "mt-1 line-clamp-1" : "mt-2"} text-xs leading-5 text-slate-700`}>{note}</p>
        </div>
        <div
          className={`${
            compact ? "mt-2 pt-2" : "mt-4 pt-3"
          } flex items-center justify-between border-t border-blue-400/40 text-xs font-semibold text-slate-700`}
        >
          <span>{delta.label}</span>
          <span>{delta.value}</span>
        </div>
      </div>
    </Card>
  );
}

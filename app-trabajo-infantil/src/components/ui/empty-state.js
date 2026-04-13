export default function EmptyState({ title, description }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center rounded-[28px] border border-dashed border-line bg-surface px-6 py-10 text-center">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted">{description}</p>
    </div>
  );
}

import Sidebar from "@/components/layout/sidebar";

export default function AppShell({
  title,
  description,
  children,
  fixedViewport = false,
  sidebarContext,
}) {
  const context = sidebarContext ?? {
    eyebrow: "Panel operativo",
    title,
    description,
  };
  const shellClass = "flex min-h-dvh flex-col bg-background text-foreground lg:flex-row";
  const contentClass = "flex min-h-0 min-w-0 flex-1 flex-col px-4 py-4 sm:px-5 xl:px-6";
  const mainClass = fixedViewport ? "flex min-h-full min-w-0 flex-1" : "flex min-w-0 flex-1";

  return (
    <div className={shellClass}>
      <Sidebar context={context} />
      <div className={contentClass}>
        <main className={mainClass}>
          <div className="flex min-h-full w-full flex-col">{children}</div>
        </main>
      </div>
    </div>
  );
}

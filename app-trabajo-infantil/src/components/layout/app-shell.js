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
  const shellClass = fixedViewport
    ? "flex h-screen overflow-hidden bg-background text-foreground"
    : "flex min-h-screen overflow-x-hidden bg-background text-foreground";
  const contentClass = fixedViewport
    ? "flex h-screen min-w-0 flex-1 flex-col overflow-hidden px-5 py-5 xl:px-6"
    : "flex min-h-screen min-w-0 flex-1 flex-col px-5 py-5 xl:px-6";
  const mainClass = fixedViewport
    ? "flex min-h-0 min-w-0 flex-1 overflow-hidden"
    : "flex min-w-0 flex-1";

  return (
    <div className={shellClass}>
      <Sidebar context={context} />
      <div className={contentClass}>
        <main className={mainClass}>
          <div className={`flex w-full flex-col ${fixedViewport ? "h-full" : "min-h-full"}`}>{children}</div>
        </main>
      </div>
    </div>
  );
}

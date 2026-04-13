"use client";

import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] min-w-0 items-center justify-center rounded-[20px] bg-surface text-sm text-muted">
      Cargando visualizacion...
    </div>
  ),
});

export default function EChartBase({ option, height = 300, className = "" }) {
  return (
    <div className={`min-w-0 overflow-hidden ${className}`.trim()}>
      <ReactECharts
        option={option}
        notMerge
        lazyUpdate
        opts={{ renderer: "svg" }}
        style={{ height, width: "100%", minWidth: 0 }}
      />
    </div>
  );
}

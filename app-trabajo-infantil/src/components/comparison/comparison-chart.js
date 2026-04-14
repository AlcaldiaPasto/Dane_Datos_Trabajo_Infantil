"use client";

import { useMemo } from "react";
import EChartBase from "@/components/charts/echart-base";
import Card from "@/components/ui/card";

const CHART_COLORS = ["#0f766e", "#f59e0b", "#2563eb", "#dc2626", "#7c3aed", "#0891b2", "#65a30d"];

export default function ComparisonChart({ snapshot }) {
  const option = useMemo(
    () => ({
      color: CHART_COLORS,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderWidth: 0,
        textStyle: { color: "#f8fafc" },
        valueFormatter: (value) => (value === null || value === undefined ? "N/D" : `${value}%`),
      },
      legend: {
        top: 0,
        right: 8,
        textStyle: { color: "#475569" },
      },
      grid: { left: 28, right: 24, top: 52, bottom: 24, containLabel: true },
      xAxis: {
        type: "category",
        data: snapshot.chart.categories,
        axisLabel: { color: "#475569" },
        axisLine: { lineStyle: { color: "rgba(15,23,42,0.12)" } },
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: "{value}%", color: "#64748b" },
        splitLine: { lineStyle: { color: "rgba(15,23,42,0.08)" } },
      },
      series: snapshot.chart.series.map((seriesItem) => ({
        name: seriesItem.name,
        type: "bar",
        data: seriesItem.data,
        barMaxWidth: 42,
        borderRadius: [10, 10, 0, 0],
      })),
    }),
    [snapshot]
  );

  return (
    <Card
      title="Comparacion porcentual de trabajo infantil por indicador"
      subtitle="Porcentaje de menores en trabajo economico, oficios intensivos y trabajo infantil ampliado por año."
      interactive
    >
      <EChartBase option={option} height={360} />
      <div className="mt-4 rounded-2xl border border-line bg-surface px-5 py-4 text-sm leading-6 text-muted">
        {snapshot.message}
      </div>
    </Card>
  );
}


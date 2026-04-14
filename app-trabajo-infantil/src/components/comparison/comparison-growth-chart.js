"use client";

import { useMemo } from "react";
import EChartBase from "@/components/charts/echart-base";
import Card from "@/components/ui/card";

export default function ComparisonGrowthChart({ snapshot }) {
  const option = useMemo(
    () => ({
      color: ["#0f766e", "#dc2626"],
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderWidth: 0,
        textStyle: { color: "#f8fafc" },
      },
      legend: {
        top: 0,
        right: 8,
        textStyle: { color: "#475569" },
      },
      grid: { left: 24, right: 16, top: 56, bottom: 20, containLabel: true },
      xAxis: {
        type: "category",
        data: snapshot.growthChart.categories,
        axisLine: { lineStyle: { color: "rgba(15,23,42,0.12)" } },
        axisLabel: { color: "#475569" },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#64748b" },
        splitLine: { lineStyle: { color: "rgba(15,23,42,0.08)" } },
      },
      series: [
        {
          name: "Crecimiento/decremento total de menores",
          type: "bar",
          data: snapshot.growthChart.totalChildrenDelta,
          barMaxWidth: 28,
          borderRadius: [8, 8, 0, 0],
        },
        {
          name: "Crecimiento/decremento trabajo infantil ampliado",
          type: "bar",
          data: snapshot.growthChart.expandedChildLaborDelta,
          barMaxWidth: 28,
          borderRadius: [8, 8, 0, 0],
        },
      ],
    }),
    [snapshot]
  );

  return (
    <Card
      title="Crecimiento o decremento interanual"
      subtitle="Diferencia absoluta entre Años para total de menores y total de trabajo infantil ampliado."
      interactive
    >
      <EChartBase option={option} height={320} />
    </Card>
  );
}

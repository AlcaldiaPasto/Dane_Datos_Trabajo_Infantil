"use client";

import { useMemo } from "react";
import EChartBase from "@/components/charts/echart-base";
import Card from "@/components/ui/card";

const SERIES_COLORS = ["#0f766e", "#f59e0b", "#2563eb", "#dc2626", "#7c3aed", "#0891b2", "#65a30d"];

export default function ComparisonAgeChart({ snapshot }) {
  const option = useMemo(
    () => ({
      color: SERIES_COLORS,
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
        data: snapshot.ageChart.categories,
        axisLine: { lineStyle: { color: "rgba(15,23,42,0.12)" } },
        axisLabel: { color: "#475569" },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#64748b" },
        splitLine: { lineStyle: { color: "rgba(15,23,42,0.08)" } },
      },
      series: snapshot.ageChart.series.map((seriesItem) => ({
        name: seriesItem.name,
        type: "bar",
        data: seriesItem.data,
        barMaxWidth: 26,
        borderRadius: [8, 8, 0, 0],
      })),
    }),
    [snapshot]
  );

  return (
    <Card
      title="Distribucion por edad de menores entre Años (columnas)"
      subtitle="Cantidad de menores por edad (5-17) para cada Año comparado."
      interactive
    >
      <EChartBase option={option} height={360} />
    </Card>
  );
}

"use client";

import { useMemo } from "react";
import EChartBase from "@/components/charts/echart-base";
import Card from "@/components/ui/card";

const SERIES_COLORS = ["#0f766e", "#f59e0b", "#2563eb", "#dc2626", "#7c3aed", "#0891b2", "#65a30d"];

export default function ComparisonAgeLineChart({ snapshot }) {
  const chart = useMemo(
    () => snapshot?.childLaborAgeChart || { categories: [], series: [], hasComparableCoverage: false },
    [snapshot]
  );

  const visibleSeries = useMemo(
    () =>
      (chart.series || []).filter(
        (seriesItem) => Array.isArray(seriesItem.data) && seriesItem.data.some((value) => Number.isFinite(value))
      ),
    [chart]
  );

  const option = useMemo(
    () => ({
      color: SERIES_COLORS,
      tooltip: {
        trigger: "axis",
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
        boundaryGap: false,
        data: chart.categories,
        axisLine: { lineStyle: { color: "rgba(15,23,42,0.12)" } },
        axisLabel: { color: "#475569" },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#64748b" },
        splitLine: { lineStyle: { color: "rgba(15,23,42,0.08)" } },
      },
      series: visibleSeries.map((seriesItem) => ({
        name: seriesItem.name,
        type: "line",
        smooth: true,
        symbolSize: 7,
        lineStyle: { width: 3 },
        areaStyle: { opacity: 0.08 },
        data: seriesItem.data,
      })),
    }),
    [chart, visibleSeries]
  );

  if (!chart.hasComparableCoverage || visibleSeries.length < 2) {
    return (
      <Card
        title={"Tendencia de trabajo infantil por edad entre a\u00f1os (l\u00ednea)"}
        subtitle={
          "No comparable por falta de columnas o por ausencia de casos de trabajo infantil ampliado en los a\u00f1os seleccionados."
        }
      />
    );
  }

  return (
    <Card
      title={"Tendencia de trabajo infantil por edad entre a\u00f1os (l\u00ednea)"}
      subtitle={
        "Cantidad de menores en trabajo infantil ampliado por edad para identificar picos o ca\u00eddas entre a\u00f1os."
      }
      interactive
    >
      <EChartBase option={option} height={300} />
    </Card>
  );
}
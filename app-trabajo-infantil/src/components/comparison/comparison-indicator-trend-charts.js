"use client";

import { useMemo } from "react";
import EChartBase from "@/components/charts/echart-base";
import Card from "@/components/ui/card";

const LINE_COLORS = {
  economicWork: "#0f766e",
  intensiveChores: "#f59e0b",
  expandedChildLabor: "#dc2626",
};

function IndicatorLineChart({ title, subtitle, years, values, color }) {
  const option = useMemo(
    () => ({
      color: [color],
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderWidth: 0,
        textStyle: { color: "#f8fafc" },
        valueFormatter: (value) => (value === null || value === undefined ? "N/D" : `${value}%`),
      },
      grid: { left: 24, right: 16, top: 18, bottom: 16, containLabel: true },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: years,
        axisLine: { lineStyle: { color: "rgba(15,23,42,0.12)" } },
        axisLabel: { color: "#475569" },
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: "{value}%", color: "#64748b" },
        splitLine: { lineStyle: { color: "rgba(15,23,42,0.08)" } },
      },
      series: [
        {
          name: title,
          type: "line",
          smooth: true,
          symbolSize: 8,
          lineStyle: { width: 3 },
          areaStyle: { opacity: 0.08 },
          data: values,
        },
      ],
    }),
    [color, title, years, values]
  );

  return (
    <Card title={title} subtitle={subtitle} interactive className="h-full overflow-hidden p-4">
      <EChartBase option={option} height={220} />
    </Card>
  );
}

export default function ComparisonIndicatorTrendCharts({ snapshot }) {
  const { years, economicWork, intensiveChores, expandedChildLabor } = snapshot.trendCharts;

  return (
    <section className="grid min-w-0 gap-5 xl:grid-cols-3">
      <IndicatorLineChart
        title="Tendencia de trabajo economico"
        subtitle="Porcentaje de menores que realizan trabajo economico por año."
        years={years}
        values={economicWork}
        color={LINE_COLORS.economicWork}
      />
      <IndicatorLineChart
        title="Tendencia de oficios intensivos"
        subtitle="Porcentaje de menores con 15 horas o mas de oficios del hogar por año."
        years={years}
        values={intensiveChores}
        color={LINE_COLORS.intensiveChores}
      />
      <IndicatorLineChart
        title="Tendencia de trabajo infantil ampliado"
        subtitle="Porcentaje de menores en trabajo infantil ampliado por año."
        years={years}
        values={expandedChildLabor}
        color={LINE_COLORS.expandedChildLabor}
      />
    </section>
  );
}


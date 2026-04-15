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

function hasComparableSeries(series) {
  return Array.isArray(series?.years) && series.years.length >= 2 && Array.isArray(series?.values) && series.values.length >= 2;
}

export default function ComparisonIndicatorTrendCharts({ snapshot }) {
  const { economicWork, intensiveChores, expandedChildLabor } = snapshot.trendCharts;

  const charts = [
    {
      key: "economic",
      enabled: hasComparableSeries(economicWork),
      title: "Tendencia de trabajo económico",
      subtitle: "Porcentaje de menores que realizan trabajo económico por año.",
      series: economicWork,
      color: LINE_COLORS.economicWork,
    },
    {
      key: "intensive",
      enabled: hasComparableSeries(intensiveChores),
      title: "Tendencia de oficios intensivos",
      subtitle: "Porcentaje de menores con 15 horas o más de oficios del hogar por año.",
      series: intensiveChores,
      color: LINE_COLORS.intensiveChores,
    },
    {
      key: "expanded",
      enabled: hasComparableSeries(expandedChildLabor),
      title: "Tendencia de trabajo infantil ampliado",
      subtitle: "Porcentaje de menores en trabajo infantil ampliado por año.",
      series: expandedChildLabor,
      color: LINE_COLORS.expandedChildLabor,
    },
  ].filter((item) => item.enabled);

  if (!charts.length) {
    return (
      <Card
        title="Tendencias no disponibles"
        subtitle="No hay al menos dos años comparables para las tendencias de indicadores."
      />
    );
  }

  const gridClass =
    charts.length >= 3 ? "grid min-w-0 gap-5 xl:grid-cols-3" : charts.length === 2 ? "grid min-w-0 gap-5 xl:grid-cols-2" : "grid min-w-0 gap-5";

  return (
    <section className={gridClass}>
      {charts.map((chart) => (
        <IndicatorLineChart
          key={chart.key}
          title={chart.title}
          subtitle={chart.subtitle}
          years={chart.series.years}
          values={chart.series.values}
          color={chart.color}
        />
      ))}
    </section>
  );
}

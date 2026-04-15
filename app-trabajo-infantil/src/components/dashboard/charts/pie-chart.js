"use client";

import { useMemo } from "react";
import EChartBase from "@/components/charts/echart-base";
import Card from "@/components/ui/card";

export default function PieChart({ title, subtitle, slices, height = 280 }) {
  const hasData = Array.isArray(slices) && slices.some((slice) => Number(slice?.value || 0) > 0);
  const option = useMemo(
    () => ({
      color: ["#0f766e", "#1d4ed8", "#f59e0b", "#e11d48"],
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderWidth: 0,
        textStyle: { color: "#f8fafc" },
      },
      legend: {
        orient: "vertical",
        right: 0,
        top: "center",
        textStyle: { color: "#475569", fontFamily: "var(--font-manrope)" },
      },
      series: [
        {
          type: "pie",
          radius: ["50%", "72%"],
          center: ["34%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: "#ffffff", borderWidth: 4 },
          label: { show: true, formatter: "{d}%", color: "#334155", fontWeight: 600 },
          labelLine: { show: false },
          data: slices.map((slice) => ({ name: slice.label, value: slice.value })),
        },
      ],
    }),
    [slices]
  );

  if (!hasData) {
    return (
      <Card
        title={title}
        subtitle={`${subtitle} No disponible para el año o filtros activos por falta de datos comparables.`}
      />
    );
  }

  return (
    <Card title={title} subtitle={subtitle} interactive className="h-full overflow-hidden p-4">
      <EChartBase option={option} height={height} />
    </Card>
  );
}

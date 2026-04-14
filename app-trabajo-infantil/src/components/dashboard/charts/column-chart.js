"use client";

import { useMemo } from "react";
import EChartBase from "@/components/charts/echart-base";
import Card from "@/components/ui/card";

export default function ColumnChart({ title, subtitle, categories, values, height = 260 }) {
  const option = useMemo(
    () => ({
      color: ["#0f766e"],
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderWidth: 0,
        textStyle: { color: "#f8fafc" },
      },
      grid: { left: 22, right: 16, top: 24, bottom: 20, containLabel: true },
      xAxis: {
        type: "category",
        data: categories,
        axisLine: { lineStyle: { color: "rgba(15, 23, 42, 0.12)" } },
        axisLabel: { color: "#64748b" },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(15, 23, 42, 0.08)" } },
        axisLabel: { color: "#64748b" },
      },
      series: [
        {
          name: "Menores",
          type: "bar",
          data: values,
          barMaxWidth: 24,
          borderRadius: [8, 8, 0, 0],
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#0f766e" },
                { offset: 1, color: "#155e75" },
              ],
            },
          },
        },
      ],
    }),
    [categories, values]
  );

  return (
    <Card title={title} subtitle={subtitle} interactive className="h-full overflow-hidden p-4">
      <EChartBase option={option} height={height} />
    </Card>
  );
}

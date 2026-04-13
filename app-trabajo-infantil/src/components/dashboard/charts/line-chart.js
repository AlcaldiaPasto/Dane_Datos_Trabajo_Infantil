"use client";

import { useMemo } from "react";
import EChartBase from "@/components/charts/echart-base";
import Card from "@/components/ui/card";

export default function LineChart({ title, subtitle, categories, values, height = 260 }) {
  const option = useMemo(
    () => ({
      color: ["#0f766e"],
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderWidth: 0,
        textStyle: { color: "#f8fafc" },
      },
      grid: { left: 18, right: 18, top: 28, bottom: 20, containLabel: true },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: categories,
        axisLine: { lineStyle: { color: "rgba(15, 23, 42, 0.08)" } },
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
          type: "line",
          smooth: true,
          symbolSize: 9,
          lineStyle: { width: 4 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(15, 118, 110, 0.24)" },
                { offset: 1, color: "rgba(15, 118, 110, 0.02)" },
              ],
            },
          },
          data: values,
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

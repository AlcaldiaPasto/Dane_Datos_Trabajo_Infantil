"use client";

import { useMemo } from "react";
import EChartBase from "@/components/charts/echart-base";
import Card from "@/components/ui/card";

export default function BarChart({ title, subtitle, categories, values, height = 260 }) {
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
      grid: { left: 10, right: 24, top: 8, bottom: 14, containLabel: true },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(15, 23, 42, 0.08)" } },
        axisLabel: { color: "#64748b" },
      },
      yAxis: {
        type: "category",
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#334155", width: 118, overflow: "truncate" },
      },
      series: [
        {
          type: "bar",
          data: values,
          barWidth: 18,
          borderRadius: [0, 10, 10, 0],
          showBackground: true,
          backgroundStyle: { color: "rgba(148, 163, 184, 0.08)", borderRadius: [0, 10, 10, 0] },
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: "#0f766e" },
                { offset: 1, color: "#155e75" },
              ],
            },
          },
          label: { show: true, position: "right", color: "#334155" },
        },
      ],
    }),
    [categories, values]
  );

  return (
    <Card title={title} subtitle={subtitle} interactive className="overflow-hidden p-4">
      <EChartBase option={option} height={height} />
    </Card>
  );
}

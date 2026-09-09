"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
  scored: { label: "Sudah dinilai (final)", color: "var(--primary)" },
  remaining: { label: "Belum dinilai", color: "var(--muted)" },
} satisfies ChartConfig

export function JudgeProgressChart({
  data,
}: {
  data: { judge: string; scored: number; remaining: number }[]
}) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="judge" tickLine={false} axisLine={false} className="text-xs" />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="scored" stackId="a" fill="var(--color-scored)" radius={[0, 0, 4, 4]} />
        <Bar dataKey="remaining" stackId="a" fill="var(--color-remaining)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

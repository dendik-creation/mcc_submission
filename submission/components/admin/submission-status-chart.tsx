"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
  count: { label: "Peserta", color: "var(--primary)" },
} satisfies ChartConfig

export function SubmissionStatusChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" allowDecimals={false} hide />
        <YAxis
          dataKey="status"
          type="category"
          tickLine={false}
          axisLine={false}
          width={130}
          className="text-xs"
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { Report } from "@/lib/types"

interface ProgressChartProps {
  reports: Report[]
}

export function ProgressChart({ reports }: ProgressChartProps) {
  const chartData = reports.slice(0, 10).map((report) => ({
    name: `#${report.no}`,
    progress: report.progress_percentage,
    lokasi: report.lokasi,
  }))

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle>Progress Overview</CardTitle>
        <CardDescription>Progress percentage by report number</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`${value}%`, "Progress"]}
            />
            <Legend />
            <Bar dataKey="progress" fill="#0f172a" radius={[4, 4, 0, 0]} name="Progress %" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

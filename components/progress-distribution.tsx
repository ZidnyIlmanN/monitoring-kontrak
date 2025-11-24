"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"
import type { Report } from "@/lib/types"

interface ProgressDistributionProps {
  reports: Report[]
}

export function ProgressDistribution({ reports }: ProgressDistributionProps) {
  const notStarted = reports.filter((r) => r.progress_percentage === 0).length
  const inProgress = reports.filter((r) => r.progress_percentage > 0 && r.progress_percentage < 100).length
  const completed = reports.filter((r) => r.progress_percentage === 100).length

  const data = [
    { name: "Not Started", value: notStarted, color: "#ef4444" },
    { name: "In Progress", value: inProgress, color: "#3b82f6" },
    { name: "Completed", value: completed, color: "#22c55e" },
  ].filter((item) => item.value > 0)

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle>Progress Distribution</CardTitle>
        <CardDescription>Reports by completion status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

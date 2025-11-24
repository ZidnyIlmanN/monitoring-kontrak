"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { Report } from "@/lib/types"

interface BudgetChartProps {
  reports: Report[]
}

export function BudgetChart({ reports }: BudgetChartProps) {
  const chartData = reports.slice(0, 10).map((report) => {
    const budget = Number(report.nilai_rekapitulasi_estimasi_biaya || 0)
    const spent = (budget * report.progress_percentage) / 100

    return {
      name: `#${report.no}`,
      budget,
      spent,
      lokasi: report.lokasi,
    }
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      notation: "compact",
    }).format(value)
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle>Analisis Anggaran</CardTitle>
        <CardDescription>Total anggaran vs estimasi terpakai per laporan</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={formatCurrency} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [formatCurrency(value), ""]}
            />
            <Legend />
            <Bar dataKey="budget" fill="#64748b" radius={[4, 4, 0, 0]} name="Total Anggaran" />
            <Bar dataKey="spent" fill="#0f172a" radius={[4, 4, 0, 0]} name="Estimasi Terpakai" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

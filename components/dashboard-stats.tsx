"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { KontrakPayung, SPK } from "@/lib/types"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from "recharts"

interface DashboardStatsProps {
  kontrakList: (KontrakPayung & { sisa_nilai_kontrak?: number })[]
  spkList: SPK[]
  notifikasiCount: number
}

export function DashboardStats({ kontrakList, spkList, notifikasiCount }: DashboardStatsProps) {
  const supabase = createClient()

  async function fetchKontrak() {
    const { data, error } = await supabase.from("kontrak_payung").select("*").order("created_at", { ascending: false })
    if (error) throw error
    return (data || []) as KontrakPayung[]
  }

  async function fetchSPK() {
    const { data, error } = await supabase.from("spk").select("*")
    if (error) throw error
    return (data || []) as SPK[]
  }

  async function fetchNotifikasiCount() {
    const { count, error } = await supabase.from("notifikasi").select("*", { count: "exact", head: true })
    if (error) throw error
    return count || 0
  }

  const { data: kontrakData = [], mutate: mutateKontrak } = useSWR("dashboard:kontrak", fetchKontrak, {
    fallbackData: kontrakList,
  })

  const { data: spkData = [], mutate: mutateSpk } = useSWR("dashboard:spk", fetchSPK, { fallbackData: spkList })

  const { data: notifikasiData = 0, mutate: mutateNotif } = useSWR("dashboard:notifikasi-count", fetchNotifikasiCount, {
    fallbackData: notifikasiCount,
  })

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-stats-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "spk" }, () => {
        mutateSpk()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "kontrak_payung" }, () => {
        mutateKontrak()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "notifikasi" }, () => {
        mutateNotif()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mutateSpk, mutateKontrak, mutateNotif, supabase])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const totalKontrak = kontrakData.length
  const totalSPK = spkData.length
  const totalNotifikasi = notifikasiData

  const totalNilaiKontrak = kontrakData.reduce((sum, k) => sum + (k.nilai_kontrak || 0), 0)
  const totalNilaiSPK = spkData.reduce((sum, s) => sum + (s.nilai_rekapitulasi_estimasi_biaya || 0), 0)
  const totalRealisasiSPK = spkData.reduce((sum, s) => sum + (s.realisasi_spk || 0), 0)
  const averageProgress =
    spkData.length > 0 ? spkData.reduce((sum, s) => sum + (s.progress_percentage || 0), 0) / spkData.length : 0
  const completedSPK = spkData.filter((s) => s.progress_percentage === 100).length

  const spkByKontrak = useMemo(() => {
    const map = new Map<string, SPK[]>()
    for (const s of spkData) {
      const arr = map.get(s.kontrak_payung_id) || []
      arr.push(s)
      map.set(s.kontrak_payung_id, arr)
    }
    return map
  }, [spkData])

  const kontrakStatus = useMemo(() => {
    let aktif = 0 // memiliki SPK apa pun
    let belumSelesai = 0 // memiliki SPK dan ada yang progress < 100
    let selesai = 0 // memiliki SPK dan semua progress 100

    for (const k of kontrakData) {
      const list = spkByKontrak.get(k.id) || []
      if (list.length > 0) {
        aktif += 1
        const allDone = list.every((s) => s.progress_percentage === 100)
        if (allDone) selesai += 1
        else belumSelesai += 1
      }
    }
    return { aktif, belumSelesai, selesai }
  }, [kontrakData, spkByKontrak])

  const aktifPct = totalKontrak > 0 ? Math.round((kontrakStatus.aktif / totalKontrak) * 100) : 0
  const belumSelesaiPct = totalKontrak > 0 ? Math.round((kontrakStatus.belumSelesai / totalKontrak) * 100) : 0
  const selesaiPct = totalKontrak > 0 ? Math.round((kontrakStatus.selesai / totalKontrak) * 100) : 0

  const nilaiSPKPerKontrak = useMemo(() => {
    return kontrakData
      .map((k) => {
        const list = spkByKontrak.get(k.id) || []
        const total = list.reduce((sum, s) => sum + (s.nilai_rekapitulasi_estimasi_biaya || 0), 0)
        return {
          id: k.id,
          nama: k.nama_kontrak_payung,
          totalNilai: total,
          completed: list.filter((s) => s.progress_percentage === 100).length,
          incomplete: list.filter((s) => s.progress_percentage < 100).length,
        }
      })
      .sort((a, b) => b.totalNilai - a.totalNilai)
      .slice(0, 5)
  }, [kontrakData, spkByKontrak])

  const [statusFilter, setStatusFilter] = useState<"all" | "incomplete" | "completed">("all")
  const filteredSpk = useMemo(() => {
    let filtered = spkData
    if (statusFilter === "completed") filtered = spkData.filter((s) => s.progress_percentage === 100)
    else if (statusFilter === "incomplete") filtered = spkData.filter((s) => s.progress_percentage < 100)
    return filtered.sort((a, b) => a.no_spk.localeCompare(b.no_spk))
  }, [statusFilter, spkData])

  return (
    <div className="space-y-6">
      {/* Row 1: Ringkasan */}
      <Card className="border-slate-200">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-600">Ringkasan</CardTitle>
          {/* Notifikasi badge */}
          <div className="text-xs text-slate-500">
            Notifikasi: <span className="font-semibold text-slate-700">{notifikasiData}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Total Kontrak</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{totalKontrak}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Total SPK</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{totalSPK}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Rata-rata Progress</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{averageProgress.toFixed(1)}%</p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">SPK Selesai</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {completedSPK}/{totalSPK}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Nilai Kontrak Payung</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(totalNilaiKontrak)}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Nilai SPK</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(totalNilaiSPK)}</p>
            </div>
            <div className="rounded-md border border-red-200 p-3">
              <p className="text-xs text-red-500">Total Realisasi SPK</p>
              <p className="mt-1 text-lg font-semibold text-red-900">{formatCurrency(totalRealisasiSPK)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 2: Chart + List SPK */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Chart nilai SPK per Kontrak (Top 5) */}
        <Card className="border-slate-200">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-600">Nilai SPK per Kontrak (Top 5)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nilaiSPKPerKontrak} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="nama"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} />
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val), "Nilai SPK"]}
                  labelStyle={{ color: "#000" }}
                />
                <Bar dataKey="totalNilai" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="totalNilai"
                    position="top"
                    formatter={(label: any) => {
                      const numeric =
                        typeof label === "number"
                          ? label
                          : typeof label === "string" && !isNaN(Number(label))
                          ? Number(label)
                          : undefined
                      return typeof numeric === "number" ? `${(numeric / 1000000).toFixed(1)}M` : label
                    }}
                    fontSize={10}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daftar SPK dengan progress + filter */}
        <Card className="border-slate-200">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-600">Progress SPK</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  statusFilter === "all"
                    ? "bg-[#0073fe] text-white hover:bg-[#0062d9]"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                )}
                aria-pressed={statusFilter === "all"}
              >
                Semua
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStatusFilter("incomplete")}
                className={cn(
                  statusFilter === "incomplete"
                    ? "bg-[#0073fe] text-white hover:bg-[#0062d9]"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                )}
                aria-pressed={statusFilter === "incomplete"}
              >
                Belum selesai
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStatusFilter("completed")}
                className={cn(
                  statusFilter === "completed"
                    ? "bg-[#0073fe] text-white hover:bg-[#0062d9]"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                )}
                aria-pressed={statusFilter === "completed"}
              >
                Selesai
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {filteredSpk.map((s) => (
                <div key={s.id} className="rounded-md border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-900">{s.judul_spk}</div>
                    <div className="text-xs text-slate-500">#{s.no_spk}</div>
                  </div>
                  <div className="mt-2">
                    <div className="h-2 w-full rounded bg-slate-200" aria-label={`Progress ${s.progress_percentage}%`}>
                      <div
                        className="h-2 rounded bg-sky-500"
                        style={{ width: `${Math.min(Math.max(s.progress_percentage, 0), 100)}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-600">{s.progress_percentage}% selesai</div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Nilai:{" "}
                    <span className="font-medium text-slate-700">
                      {formatCurrency(s.nilai_rekapitulasi_estimasi_biaya || 0)}
                    </span>
                  </div>
                </div>
              ))}
              {filteredSpk.length === 0 && <div className="text-sm text-slate-600">Tidak ada SPK pada filter ini.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

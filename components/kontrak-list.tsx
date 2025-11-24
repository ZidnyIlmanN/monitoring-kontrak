"use client"

import { useState } from "react"
import type { KontrakPayung } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, FileText, Calendar, DollarSign, ChevronRight, Download } from "lucide-react"
import Link from "next/link"

interface KontrakListProps {
  kontrakList: (KontrakPayung & { sisa_nilai_kontrak?: number })[]
}

export function KontrakList({ kontrakList }: KontrakListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredKontrak = kontrakList.filter((kontrak) => {
    const query = searchQuery.toLowerCase()
    return (
      kontrak.nama_kontrak_payung.toLowerCase().includes(query) ||
      kontrak.nomor_oas.toLowerCase().includes(query) ||
      kontrak.periode_kontrak.toLowerCase().includes(query)
    )
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Cari kontrak berdasarkan nama, nomor OAS, atau periode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Kontrak Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredKontrak.map((kontrak) => (
          <Card key={kontrak.id} className="hover:shadow-lg transition-shadow h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900 line-clamp-2">
                {kontrak.nama_kontrak_payung}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-500 text-xs">Nomor OAS</p>
                  <p className="text-slate-900 font-medium">{kontrak.nomor_oas}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-500 text-xs">Periode Kontrak</p>
                  <p className="text-slate-900 font-medium">{kontrak.periode_kontrak}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-500 text-xs">Nilai Kontrak</p>
                  <p className="text-slate-900 font-semibold">{formatCurrency(kontrak.nilai_kontrak)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-500 text-xs">Sisa Nilai Kontrak</p>
                  <p className="text-red-900 font-semibold">{formatCurrency(kontrak.sisa_nilai_kontrak || kontrak.nilai_kontrak)}</p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Link href={`/dashboard/kontrak/${kontrak.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                    Lihat Detail
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/dashboard/kontrak/${kontrak.id}/print`} target="_blank">
                  <Button variant="ghost" size="sm" className="gap-2 border-1 border-[#00B74A] text-[#00B74A] hover:bg-[#E6F9EC]">
                    <Download className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredKontrak.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">Tidak ada kontrak ditemukan</p>
          <p className="text-slate-400 text-sm mt-1">Coba ubah kata kunci pencarian Anda</p>
        </div>
      )}
    </div>
  )
}

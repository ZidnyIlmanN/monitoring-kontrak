import type { KontrakPayung } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, DollarSign, Clock, Download } from "lucide-react"
import Link from "next/link"

interface KontrakDetailHeaderProps {
  kontrak: KontrakPayung
  sisaNilaiKontrak: number
}

export function KontrakDetailHeader({ kontrak, sisaNilaiKontrak }: KontrakDetailHeaderProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card className="mb-8 border-slate-200 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{kontrak.nama_kontrak_payung}</h1>
          <Link href={`/dashboard/kontrak/${kontrak.id}/print`} target="_blank">
            <Button variant="outline" size="sm" className="gap-2 bg-[#E5F6FD] hover:bg-[#D0EFFB] text-[#00ADEF] border-[#00ADEF]">
              <Download className="h-4 w-4" />
              Export PDF Laporan
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent border border-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Nomor OAS</p>
              <p className="text-sm font-semibold text-slate-900">{kontrak.nomor_oas}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent border border-green-100">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Waktu Perjanjian</p>
              <p className="text-sm font-semibold text-slate-900">{kontrak.waktu_perjanjian}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent border border-purple-100">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Periode Kontrak</p>
              <p className="text-sm font-semibold text-slate-900">{kontrak.periode_kontrak}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent border border-amber-100">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Nilai Kontrak</p>
              <p className="text-sm font-semibold text-slate-900">{formatCurrency(kontrak.nilai_kontrak)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent border border-red-100">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-red-500 mb-1">Sisa Nilai Kontrak</p>
              <p className="text-sm font-semibold text-red-900">{formatCurrency(sisaNilaiKontrak)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

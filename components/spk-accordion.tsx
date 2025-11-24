"use client"

import { useState } from "react"
import type { SPKWithNotifikasi } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronDown, ChevronUp, Edit, Trash2, Plus, FileText, ImageIcon } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SPKAccordionProps {
  spkList: SPKWithNotifikasi[]
  kontrakId: string
}

export function SPKAccordion({ spkList, kontrakId }: SPKAccordionProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const router = useRouter()

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const handleDelete = async (spkId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus SPK ini? Semua notifikasi terkait juga akan dihapus.")) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("spk").delete().eq("id", spkId)

    if (error) {
      alert("Gagal menghapus SPK: " + error.message)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {spkList.map((spk, index) => {
        const isExpanded = expandedIds.has(spk.id)
        const images = [spk.image_url_1, spk.image_url_2, spk.image_url_3].filter(Boolean)
        const pdfs = [spk.pdf_url_1, spk.pdf_url_2, spk.pdf_url_3].filter(Boolean)

        return (
          <Card key={spk.id} className="border-slate-200 shadow-sm overflow-hidden">
            {/* SPK Header - Always Visible */}
            <div
              className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => toggleExpand(spk.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0073fe] text-white text-sm font-semibold">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 text-lg">{spk.judul_spk}</h4>
                      <p className="text-sm text-slate-600">No. SPK: {spk.no_spk}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mt-4">
                    <div>
                      <p className="text-xs text-slate-500">Durasi SPK</p>
                      <p className="text-sm font-medium text-slate-900">{spk.durasi_spk}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Nilai Estimasi</p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(spk.nilai_rekapitulasi_estimasi_biaya)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Realisasi SPK</p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(Number(spk.realisasi_spk) || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={spk.progress_percentage} className="h-2 flex-1" />
                        <span className="text-sm font-semibold text-slate-900 min-w-[3rem] text-right">
                          {spk.progress_percentage}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Jumlah Notifikasi</p>
                      <p className="text-sm font-medium text-slate-900">{spk.notifikasi.length} notifikasi</p>
                    </div>
                  </div>
                </div>

                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {/* SPK Details - Expandable */}
            {isExpanded && (
              <CardContent className="border-t border-slate-200 bg-slate-50 pt-4">
                {/* Keterangan */}
                {spk.keterangan && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-1">Keterangan</p>
                    <p className="text-sm text-slate-700">{spk.keterangan}</p>
                  </div>
                )}

                {/* Images */}
                {images.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2">Bukti Gambar ({images.length})</p>
                    <div className="flex gap-2 flex-wrap">
                      {images.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setImagePreview(url)}
                          className="relative h-20 w-20 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-slate-400 transition-colors"
                        >
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Bukti ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* PDF files */}
                {pdfs.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2">Bukti PDF ({pdfs.length})</p>
                    <div className="flex gap-2 flex-wrap">
                      {pdfs.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 border-2 border-slate-200 rounded-lg hover:border-slate-400 hover:bg-white transition-colors"
                        >
                          <FileText className="h-5 w-5 text-red-600" />
                          <span className="text-xs text-slate-700">PDF {idx + 1}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notifikasi Table */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-900">Daftar Notifikasi</p>
                    <Link href={`/dashboard/kontrak/${kontrakId}/spk/${spk.id}/notifikasi/new`}>
                      <Button size="sm" variant="outline" className="gap-1 h-8 bg-[#4CD964] hover:bg-[#43c85a] text-white">
                        <Plus className="h-3 w-3" />
                        Tambah Notifikasi
                      </Button>
                    </Link>
                  </div>

                  {spk.notifikasi.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-white">
                            <th className="text-left p-2 font-semibold text-slate-700">No. Notif</th>
                            <th className="text-left p-2 font-semibold text-slate-700">Judul Notifikasi</th>
                            <th className="text-left p-2 font-semibold text-slate-700">Lokasi</th>
                            <th className="text-center p-2 font-semibold text-slate-700">Lampiran</th>
                            <th className="text-right p-2 font-semibold text-slate-700">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {spk.notifikasi.map((notif) => (
                            <tr key={notif.id} className="border-b border-slate-100 bg-white hover:bg-slate-50">
                              <td className="p-2 text-slate-900">{notif.no_notif}</td>
                              <td className="p-2 text-slate-900">{notif.judul_notifikasi}</td>
                              <td className="p-2 text-slate-900">{notif.lokasi}</td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {notif.image_url && (
                                    <button
                                      onClick={() => setImagePreview(notif.image_url)}
                                      className="text-blue-600 hover:text-blue-700"
                                      title="Lihat Foto"
                                    >
                                      <ImageIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                  {notif.pdf_url && (
                                    <a
                                      href={notif.pdf_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-red-600 hover:text-red-700"
                                      title="Lihat PDF"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </a>
                                  )}
                                  {!notif.image_url && !notif.pdf_url && (
                                    <span className="text-slate-400 text-xs">-</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-2 text-right">
                                <Link
                                  href={`/dashboard/kontrak/${kontrakId}/spk/${spk.id}/notifikasi/${notif.id}/edit`}
                                >
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4 bg-white rounded border border-slate-200">
                      Belum ada notifikasi
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end">
                  <Link href={`/dashboard/kontrak/${kontrakId}/spk/${spk.id}/edit`}>
                    <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                      <Edit className="h-4 w-4" />
                      Edit SPK
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                    onClick={() => handleDelete(spk.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus SPK
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}

      {/* Image Preview Modal */}
      {imagePreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setImagePreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={imagePreview || "/placeholder.svg"}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 bg-white"
              onClick={() => setImagePreview(null)}
            >
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

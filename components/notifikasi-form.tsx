"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Plus, Trash2, Upload, FileText, X } from "lucide-react"
import type { Notifikasi } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface NotifikasiFormProps {
  spkId: string
  kontrakId: string
  initialData?: Notifikasi
}

interface NotifikasiEntry {
  no_notif: string
  judul_notifikasi: string
  lokasi: string
  imageFile: File | null
  pdfFile: File | null
  existingImageUrl: string | null
  existingPdfUrl: string | null
}

export function NotifikasiForm({ spkId, kontrakId, initialData }: NotifikasiFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const [entries, setEntries] = useState<NotifikasiEntry[]>(
    initialData
      ? [
          {
            no_notif: initialData.no_notif,
            judul_notifikasi: initialData.judul_notifikasi,
            lokasi: initialData.lokasi,
            imageFile: null,
            pdfFile: null,
            existingImageUrl: initialData.image_url,
            existingPdfUrl: initialData.pdf_url,
          },
        ]
      : [
          {
            no_notif: "",
            judul_notifikasi: "",
            lokasi: "",
            imageFile: null,
            pdfFile: null,
            existingImageUrl: null,
            existingPdfUrl: null,
          },
        ],
  )

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        no_notif: "",
        judul_notifikasi: "",
        lokasi: "",
        imageFile: null,
        pdfFile: null,
        existingImageUrl: null,
        existingPdfUrl: null,
      },
    ])
  }

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index))
    }
  }

  const updateEntry = (index: number, field: keyof NotifikasiEntry, value: any) => {
    const newEntries = [...entries]
    newEntries[index][field] = value
    setEntries(newEntries)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    if (initialData?.id) {
      // Update single entry
      let imageUrl = entries[0].existingImageUrl
      let pdfUrl = entries[0].existingPdfUrl

      if (entries[0].imageFile) {
        const file = entries[0].imageFile
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${spkId}/${fileName}`

        const { error: uploadError } = await supabase.storage.from("report-images").upload(filePath, file)

        if (uploadError) {
          alert(`Gagal upload gambar: ${uploadError.message}`)
          setLoading(false)
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("report-images").getPublicUrl(filePath)
        imageUrl = publicUrl
      }

      if (entries[0].pdfFile) {
        const file = entries[0].pdfFile
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${spkId}/${fileName}`

        const { error: uploadError } = await supabase.storage.from("report-pdfs").upload(filePath, file)

        if (uploadError) {
          alert(`Gagal upload PDF: ${uploadError.message}`)
          setLoading(false)
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("report-pdfs").getPublicUrl(filePath)
        pdfUrl = publicUrl
      }

      const { error } = await supabase
        .from("notifikasi")
        .update({
          no_notif: entries[0].no_notif,
          judul_notifikasi: entries[0].judul_notifikasi,
          lokasi: entries[0].lokasi,
          image_url: imageUrl,
          pdf_url: pdfUrl,
        })
        .eq("id", initialData.id)

      if (error) {
        alert("Gagal mengupdate notifikasi: " + error.message)
        setLoading(false)
        return
      }

      showToast({
        title: "Berhasil!",
        message: "Notifikasi berhasil diperbarui.",
        type: "success",
      })
    } else {
      const dataToInsert = []

      for (const entry of entries) {
        let imageUrl = null
        let pdfUrl = null

        // Upload image if provided
        if (entry.imageFile) {
          const file = entry.imageFile
          const fileExt = file.name.split(".").pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `${spkId}/${fileName}`

          const { error: uploadError } = await supabase.storage.from("report-images").upload(filePath, file)

          if (uploadError) {
            alert(`Gagal upload gambar: ${uploadError.message}`)
            setLoading(false)
            return
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("report-images").getPublicUrl(filePath)
          imageUrl = publicUrl
        }

        // Upload PDF if provided
        if (entry.pdfFile) {
          const file = entry.pdfFile
          const fileExt = file.name.split(".").pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `${spkId}/${fileName}`

          const { error: uploadError } = await supabase.storage.from("report-pdfs").upload(filePath, file)

          if (uploadError) {
            alert(`Gagal upload PDF: ${uploadError.message}`)
            setLoading(false)
            return
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("report-pdfs").getPublicUrl(filePath)
          pdfUrl = publicUrl
        }

        dataToInsert.push({
          spk_id: spkId,
          no_notif: entry.no_notif,
          judul_notifikasi: entry.judul_notifikasi,
          lokasi: entry.lokasi,
          image_url: imageUrl,
          pdf_url: pdfUrl,
        })
      }

      const { error } = await supabase.from("notifikasi").insert(dataToInsert)

      if (error) {
        alert("Gagal membuat notifikasi: " + error.message)
        setLoading(false)
        return
      }

      showToast({
        title: "Berhasil!",
        message: `${entries.length} notifikasi berhasil ditambahkan.`,
        type: "success",
      })
    }

    router.push(`/dashboard/kontrak/${kontrakId}`)
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {entries.map((entry, index) => (
            <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-4 relative">
              {!initialData && entries.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => removeEntry(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-semibold">
                    {index + 1}
                  </div>
                  <h3 className="font-semibold text-slate-900">Notifikasi {index + 1}</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`no_notif_${index}`}>No. Notif *</Label>
                  <Input
                    id={`no_notif_${index}`}
                    value={entry.no_notif}
                    onChange={(e) => updateEntry(index, "no_notif", e.target.value)}
                    placeholder="Contoh: NOTIF/2024/001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`judul_notifikasi_${index}`}>Judul Notifikasi *</Label>
                  <Input
                    id={`judul_notifikasi_${index}`}
                    value={entry.judul_notifikasi}
                    onChange={(e) => updateEntry(index, "judul_notifikasi", e.target.value)}
                    placeholder="Contoh: Perbaikan Jalan Ruas A"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`lokasi_${index}`}>Lokasi *</Label>
                  <Input
                    id={`lokasi_${index}`}
                    value={entry.lokasi}
                    onChange={(e) => updateEntry(index, "lokasi", e.target.value)}
                    placeholder="Contoh: KM 10+500 - KM 11+200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lampiran Foto</Label>
                  {entry.existingImageUrl && !entry.imageFile ? (
                    <div className="relative">
                      <img
                        src={entry.existingImageUrl || "/placeholder.svg"}
                        alt="Existing"
                        className="w-full h-32 object-cover rounded-lg border-2 border-slate-200"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => updateEntry(index, "existingImageUrl", null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : entry.imageFile ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(entry.imageFile) || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border-2 border-slate-200"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => updateEntry(index, "imageFile", null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <Upload className="h-6 w-6 text-slate-400 mb-2" />
                      <span className="text-xs text-slate-500">Upload Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => updateEntry(index, "imageFile", e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Lampiran PDF</Label>
                  {entry.existingPdfUrl && !entry.pdfFile ? (
                    <div className="relative">
                      <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 rounded-lg bg-slate-50 p-3">
                        <FileText className="h-8 w-8 text-red-600 mb-2" />
                        <span className="text-xs text-slate-700 text-center truncate w-full px-2">
                          {entry.existingPdfUrl?.split("/").pop()?.substring(0, 20) || "PDF File"}
                        </span>
                        <a
                          href={entry.existingPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1"
                        >
                          Lihat PDF
                        </a>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => updateEntry(index, "existingPdfUrl", null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : entry.pdfFile ? (
                    <div className="relative">
                      <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 rounded-lg bg-slate-50 p-3">
                        <FileText className="h-8 w-8 text-red-600 mb-2" />
                        <span className="text-xs text-slate-700 text-center truncate w-full px-2">
                          {entry.pdfFile.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => updateEntry(index, "pdfFile", null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <FileText className="h-6 w-6 text-slate-400 mb-2" />
                      <span className="text-xs text-slate-500">Upload PDF</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => updateEntry(index, "pdfFile", e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!initialData && (
            <Button type="button" variant="outline" onClick={addEntry} className="w-full gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Tambah Notifikasi Lainnya
            </Button>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#4CD964] hover:bg-[#43c85a]">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Update Notifikasi" : `Simpan ${entries.length} Notifikasi`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

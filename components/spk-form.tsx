"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Upload, X, FileText } from "lucide-react"
import type { SPK } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface SPKFormProps {
  kontrakId: string
  initialData?: SPK
}

export function SPKForm({ kontrakId, initialData }: SPKFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    no_spk: initialData?.no_spk || "",
    judul_spk: initialData?.judul_spk || "",
    durasi_spk: initialData?.durasi_spk || "",
    nilai_rekapitulasi_estimasi_biaya: initialData?.nilai_rekapitulasi_estimasi_biaya?.toString() || "",
    realisasi_spk: initialData?.realisasi_spk?.toString() || "",
    progress_percentage: initialData?.progress_percentage?.toString() || "0",
    keterangan: initialData?.keterangan || "",
  })

  const [images, setImages] = useState<(File | null)[]>([null, null, null])
  const [existingImages, setExistingImages] = useState<(string | null)[]>([
    initialData?.image_url_1 || null,
    initialData?.image_url_2 || null,
    initialData?.image_url_3 || null,
  ])

  const [pdfs, setPdfs] = useState<(File | null)[]>([null, null, null])
  const [existingPdfs, setExistingPdfs] = useState<(string | null)[]>([
    initialData?.pdf_url_1 || null,
    initialData?.pdf_url_2 || null,
    initialData?.pdf_url_3 || null,
  ])

  const handleImageChange = (index: number, file: File | null) => {
    const newImages = [...images]
    newImages[index] = file
    setImages(newImages)
  }

  const removeExistingImage = (index: number) => {
    const newExisting = [...existingImages]
    newExisting[index] = null
    setExistingImages(newExisting)
  }

  const handlePdfChange = (index: number, file: File | null) => {
    const newPdfs = [...pdfs]
    newPdfs[index] = file
    setPdfs(newPdfs)
  }

  const removeExistingPdf = (index: number) => {
    const newExisting = [...existingPdfs]
    newExisting[index] = null
    setExistingPdfs(newExisting)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    // Upload images
    const imageUrls: (string | null)[] = [...existingImages]

    for (let i = 0; i < images.length; i++) {
      if (images[i]) {
        const file = images[i]!
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${kontrakId}/${fileName}`

        const { error: uploadError } = await supabase.storage.from("report-images").upload(filePath, file)

        if (uploadError) {
          alert(`Gagal upload gambar ${i + 1}: ${uploadError.message}`)
          setLoading(false)
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("report-images").getPublicUrl(filePath)

        imageUrls[i] = publicUrl
      }
    }

    const pdfUrls: (string | null)[] = [...existingPdfs]

    for (let i = 0; i < pdfs.length; i++) {
      if (pdfs[i]) {
        const file = pdfs[i]!
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${kontrakId}/${fileName}`

        const { error: uploadError } = await supabase.storage.from("report-pdfs").upload(filePath, file)

        if (uploadError) {
          alert(`Gagal upload PDF ${i + 1}: ${uploadError.message}`)
          setLoading(false)
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("report-pdfs").getPublicUrl(filePath)

        pdfUrls[i] = publicUrl
      }
    }

    const dataToSave = {
      kontrak_payung_id: kontrakId,
      no_spk: formData.no_spk,
      judul_spk: formData.judul_spk,
      durasi_spk: formData.durasi_spk,
      nilai_rekapitulasi_estimasi_biaya: Number.parseFloat(formData.nilai_rekapitulasi_estimasi_biaya),
      realisasi_spk: Number.parseFloat(formData.realisasi_spk),
      progress_percentage: Number.parseInt(formData.progress_percentage),
      keterangan: formData.keterangan || null,
      image_url_1: imageUrls[0],
      image_url_2: imageUrls[1],
      image_url_3: imageUrls[2],
      pdf_url_1: pdfUrls[0],
      pdf_url_2: pdfUrls[1],
      pdf_url_3: pdfUrls[2],
    }

    if (initialData?.id) {
      // Update
      const { error } = await supabase.from("spk").update(dataToSave).eq("id", initialData.id)

      if (error) {
        alert("Gagal mengupdate SPK: " + error.message)
        setLoading(false)
        return
      }

      showToast({
        title: "Berhasil!",
        message: "SPK berhasil diperbarui.",
        type: "success",
      })
    } else {
      // Create
      const { error } = await supabase.from("spk").insert(dataToSave)

      if (error) {
        alert("Gagal membuat SPK: " + error.message)
        setLoading(false)
        return
      }

      showToast({
        title: "Berhasil!",
        message: "SPK berhasil ditambahkan.",
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
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="no_spk">No. SPK *</Label>
              <Input
                id="no_spk"
                value={formData.no_spk}
                onChange={(e) => setFormData({ ...formData, no_spk: e.target.value })}
                placeholder="Contoh: SPK/2024/001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durasi_spk">Durasi SPK *</Label>
              <Input
                id="durasi_spk"
                value={formData.durasi_spk}
                onChange={(e) => setFormData({ ...formData, durasi_spk: e.target.value })}
                placeholder="Contoh: 6 bulan"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="judul_spk">Judul SPK *</Label>
            <Input
              id="judul_spk"
              value={formData.judul_spk}
              onChange={(e) => setFormData({ ...formData, judul_spk: e.target.value })}
              placeholder="Contoh: Pekerjaan Pembangunan Jembatan"
              required
            />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="nilai_rekapitulasi_estimasi_biaya">Nilai Rekapitulasi Estimasi Biaya (Rp) *</Label>
              <Input
                id="nilai_rekapitulasi_estimasi_biaya"
                type="number"
                step="0.01"
                value={formData.nilai_rekapitulasi_estimasi_biaya}
                onChange={(e) => setFormData({ ...formData, nilai_rekapitulasi_estimasi_biaya: e.target.value })}
                placeholder="Contoh: 1000000000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="realisasi_spk">Realisasi SPK (Rp) *</Label>
              <Input
                id="realisasi_spk"
                type="number"
                step="0.01"
                value={formData.realisasi_spk}
                onChange={(e) => setFormData({ ...formData, realisasi_spk: e.target.value })}
                placeholder="Contoh: 950000000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress_percentage">Progress (%) *</Label>
              <Input
                id="progress_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.progress_percentage}
                onChange={(e) => setFormData({ ...formData, progress_percentage: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Textarea
              id="keterangan"
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              placeholder="Tambahkan catatan atau keterangan tambahan..."
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label>Bukti Gambar (Maksimal 3)</Label>
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="space-y-2">
                  <Label className="text-xs text-slate-500">Gambar {index + 1}</Label>
                  {existingImages[index] && !images[index] ? (
                    <div className="relative">
                      <img
                        src={existingImages[index]! || "/placeholder.svg"}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-slate-200"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => removeExistingImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : images[index] ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(images[index]!) || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-slate-200"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => handleImageChange(index, null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <Upload className="h-6 w-6 text-slate-400 mb-2" />
                      <span className="text-xs text-slate-500">Upload Gambar</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(index, e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Bukti PDF (Maksimal 3)</Label>
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="space-y-2">
                  <Label className="text-xs text-slate-500">PDF {index + 1}</Label>
                  {existingPdfs[index] && !pdfs[index] ? (
                    <div className="relative">
                      <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 rounded-lg bg-slate-50 p-3">
                        <FileText className="h-8 w-8 text-red-600 mb-2" />
                        <span className="text-xs text-slate-700 text-center truncate w-full px-2">
                          {existingPdfs[index]?.split("/").pop()?.substring(0, 20) || "PDF File"}
                        </span>
                        <a
                          href={existingPdfs[index]!}
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
                        onClick={() => removeExistingPdf(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : pdfs[index] ? (
                    <div className="relative">
                      <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 rounded-lg bg-slate-50 p-3">
                        <FileText className="h-8 w-8 text-red-600 mb-2" />
                        <span className="text-xs text-slate-700 text-center truncate w-full px-2">
                          {pdfs[index]?.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => handlePdfChange(index, null)}
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
                        onChange={(e) => handlePdfChange(index, e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#4CD964] hover:bg-[#43c85a]">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Update SPK" : "Simpan SPK"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

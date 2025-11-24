"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Upload, Loader2 } from "lucide-react"
import type { Report } from "@/lib/types"

interface ReportFormProps {
  report?: Report
  mode: "create" | "edit"
}

export function ReportForm({ report, mode }: ReportFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(report?.image_url || null)

  const [formData, setFormData] = useState({
    no: report?.no || 1,
    no_notif: report?.no_notif || "",
    judul_notifikasi: report?.judul_notifikasi || "",
    lokasi: report?.lokasi || "",
    no_spk: report?.no_spk || "",
    judul_spk: report?.judul_spk || "",
    durasi_spk: report?.durasi_spk || "",
    nilai_rekapitulasi_estimasi_biaya: report?.nilai_rekapitulasi_estimasi_biaya || 0,
    progress_percentage: report?.progress_percentage || 0,
    keterangan: report?.keterangan || "",
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Tidak terautentikasi")

      let imageUrl = report?.image_url || null

      // Upload image if a new one was selected
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from("report-images").upload(fileName, imageFile)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("report-images").getPublicUrl(fileName)
        imageUrl = publicUrl
      }

      const reportData = {
        ...formData,
        image_url: imageUrl,
        user_id: user.id,
      }

      if (mode === "create") {
        const { error: insertError } = await supabase.from("reports").insert(reportData)
        if (insertError) throw insertError
      } else {
        const { error: updateError } = await supabase.from("reports").update(reportData).eq("id", report!.id)
        if (updateError) throw updateError
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Buat Laporan Baru" : "Edit Laporan"}</CardTitle>
          <CardDescription>
            {mode === "create" ? "Isi detail untuk membuat laporan monitoring baru" : "Perbarui detail laporan"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="no">No</Label>
              <Input
                id="no"
                type="number"
                required
                value={formData.no || ""}
                onChange={(e) => setFormData({ ...formData, no: Number.parseInt(e.target.value) || 0 })}
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="no_notif">No Notif</Label>
              <Input
                id="no_notif"
                required
                value={formData.no_notif}
                onChange={(e) => setFormData({ ...formData, no_notif: e.target.value })}
                className="border-slate-300"
                placeholder="contoh: NOT-2024-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="judul_notifikasi">Judul Notifikasi</Label>
            <Input
              id="judul_notifikasi"
              required
              value={formData.judul_notifikasi}
              onChange={(e) => setFormData({ ...formData, judul_notifikasi: e.target.value })}
              className="border-slate-300"
              placeholder="contoh: Perbaikan Jalan Raya"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lokasi">Lokasi</Label>
            <Input
              id="lokasi"
              required
              value={formData.lokasi}
              onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
              className="border-slate-300"
              placeholder="contoh: Jalan Raya Subang KM 5"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="no_spk">No. SPK</Label>
              <Input
                id="no_spk"
                required
                value={formData.no_spk}
                onChange={(e) => setFormData({ ...formData, no_spk: e.target.value })}
                className="border-slate-300"
                placeholder="contoh: SPK-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durasi_spk">Durasi SPK</Label>
              <Input
                id="durasi_spk"
                required
                value={formData.durasi_spk}
                onChange={(e) => setFormData({ ...formData, durasi_spk: e.target.value })}
                className="border-slate-300"
                placeholder="contoh: 30 hari, 3 bulan"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="judul_spk">Judul SPK</Label>
            <Input
              id="judul_spk"
              required
              value={formData.judul_spk}
              onChange={(e) => setFormData({ ...formData, judul_spk: e.target.value })}
              className="border-slate-300"
              placeholder="contoh: Pengaspalan Jalan Raya Subang"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nilai_rekapitulasi_estimasi_biaya">Nilai Rekapitulasi Estimasi Biaya (IDR)</Label>
            <Input
              id="nilai_rekapitulasi_estimasi_biaya"
              type="number"
              required
              value={formData.nilai_rekapitulasi_estimasi_biaya || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nilai_rekapitulasi_estimasi_biaya: Number.parseFloat(e.target.value) || 0,
                })
              }
              className="border-slate-300"
            />
            <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-lg font-semibold text-slate-900">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(formData.nilai_rekapitulasi_estimasi_biaya || 0)}
            </div>
          </div>

          <div className="space-y-4">
            <Label htmlFor="progress">Progress: {formData.progress_percentage}%</Label>
            <Slider
              id="progress"
              min={0}
              max={100}
              step={5}
              value={[formData.progress_percentage || 0]}
              onValueChange={(value) => setFormData({ ...formData, progress_percentage: value[0] })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
            <Textarea
              id="keterangan"
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="border-slate-300 min-h-24"
              placeholder="Catatan atau komentar tambahan..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Unggah Gambar (Opsional)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="border-slate-300"
              />
              <Button type="button" variant="outline" className="shrink-0 bg-transparent" asChild>
                <label htmlFor="image" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Pilih File
                </label>
              </Button>
            </div>
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="max-h-64 rounded-lg border border-slate-200 object-cover"
                />
              </div>
            )}
          </div>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">{error}</div>}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Membuat..." : "Memperbarui..."}
                </>
              ) : mode === "create" ? (
                "Buat Laporan"
              ) : (
                "Perbarui Laporan"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="border-slate-300"
            >
              Batal
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

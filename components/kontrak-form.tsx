"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface KontrakFormProps {
  userId: string
  initialData?: {
    id: string
    nama_kontrak_payung: string
    nomor_oas: string
    waktu_perjanjian: string
    periode_kontrak: string
    nilai_kontrak: number
  }
}

export function KontrakForm({ userId, initialData }: KontrakFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nama_kontrak_payung: initialData?.nama_kontrak_payung || "",
    nomor_oas: initialData?.nomor_oas || "",
    waktu_perjanjian: initialData?.waktu_perjanjian || "",
    periode_kontrak: initialData?.periode_kontrak || "",
    nilai_kontrak: initialData?.nilai_kontrak?.toString() || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    const dataToSave = {
      user_id: userId,
      nama_kontrak_payung: formData.nama_kontrak_payung,
      nomor_oas: formData.nomor_oas,
      waktu_perjanjian: formData.waktu_perjanjian,
      periode_kontrak: formData.periode_kontrak,
      nilai_kontrak: Number.parseFloat(formData.nilai_kontrak),
    }

    if (initialData?.id) {
      // Update existing
      const { error } = await supabase.from("kontrak_payung").update(dataToSave).eq("id", initialData.id)

      if (error) {
        alert("Gagal mengupdate kontrak: " + error.message)
        setLoading(false)
        return
      }

      showToast({
        title: "Berhasil!",
        message: "Kontrak berhasil diperbarui.",
        type: "success",
      })
      router.push(`/dashboard/kontrak/${initialData.id}`)
    } else {
      // Create new
      const { data, error } = await supabase.from("kontrak_payung").insert(dataToSave).select().single()

      if (error) {
        alert("Gagal membuat kontrak: " + error.message)
        setLoading(false)
        return
      }

      showToast({
        title: "Berhasil!",
        message: "Kontrak berhasil ditambahkan.",
        type: "success",
      })
      router.push(`/dashboard/kontrak/${data.id}`)
    }

    router.refresh()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nama_kontrak_payung">Nama Kontrak Payung *</Label>
            <Input
              id="nama_kontrak_payung"
              value={formData.nama_kontrak_payung}
              onChange={(e) => setFormData({ ...formData, nama_kontrak_payung: e.target.value })}
              placeholder="Contoh: Kontrak Pembangunan Jalan Tol"
              required
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nomor_oas">Nomor OAS *</Label>
              <Input
                id="nomor_oas"
                value={formData.nomor_oas}
                onChange={(e) => setFormData({ ...formData, nomor_oas: e.target.value })}
                placeholder="Contoh: OAS/2024/001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waktu_perjanjian">Waktu Perjanjian *</Label>
              <Input
                id="waktu_perjanjian"
                value={formData.waktu_perjanjian}
                onChange={(e) => setFormData({ ...formData, waktu_perjanjian: e.target.value })}
                placeholder="Contoh: 15 Januari 2024"
                required
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="periode_kontrak">Periode Kontrak *</Label>
              <Input
                id="periode_kontrak"
                value={formData.periode_kontrak}
                onChange={(e) => setFormData({ ...formData, periode_kontrak: e.target.value })}
                placeholder="Contoh: Januari 2024 - Desember 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nilai_kontrak">Nilai Kontrak (Rp) *</Label>
              <Input
                id="nilai_kontrak"
                type="number"
                step="0.01"
                value={formData.nilai_kontrak}
                onChange={(e) => setFormData({ ...formData, nilai_kontrak: e.target.value })}
                placeholder="Contoh: 5000000000"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#4CD964] hover:bg-[#43c85a]">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Update Kontrak" : "Simpan Kontrak"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

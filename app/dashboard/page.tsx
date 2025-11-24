import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDb } from "@/lib/mongodb/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { KontrakList } from "@/components/kontrak-list"
import { DashboardStats } from "@/components/dashboard-stats"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import type { KontrakPayung, SPK } from "@/lib/types"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  // Fetch kontrak + spk + notifikasi from MongoDB
  const db = await getDb()
  const kontrakDocs = await db.collection("kontrakPayung").find({}).sort({ createdAt: -1 }).toArray()
  // Convert DB documents to plain objects (no ObjectId/BSON) before sending to client
  const kontrakData = (kontrakDocs || []).map((k: any) => ({
    id: String(k._id?.toString ? k._id.toString() : k.id || ""),
    nama_kontrak_payung: String(k.nama_kontrak_payung ?? k.nama_kontrak ?? ""),
    nomor_oas: String(k.nomor_oas ?? ""),
    periode_kontrak: String(k.periode_kontrak ?? ""),
    nilai_kontrak: Number(k.nilai_kontrak ?? 0),
    created_at: String(k.createdAt ?? k.created_at ?? ""),
    // Ensure fields required by the KontrakPayung type are present (provide sensible defaults)
    user_id: String(k.user_id ?? k.userId ?? ""),
    waktu_perjanjian: String(k.waktu_perjanjian ?? k.waktuPerjanjian ?? ""),
    updated_at: String(k.updatedAt ?? k.updated_at ?? ""),
  }))

  const spkDocs = await db.collection("spk").find({}).toArray()
  const spkData = (spkDocs || []).map((s: any) => ({
    id: String(s._id?.toString ? s._id.toString() : s.id || ""),
    kontrak_payung_id: String(s.kontrak_payung_id ?? ""),
    no_spk: String(s.no_spk ?? ""),
    judul_spk: String(s.judul_spk ?? ""),
    durasi_spk: String(s.durasi_spk ?? ""),
    nilai_rekapitulasi_estimasi_biaya: Number(s.nilai_rekapitulasi_estimasi_biaya ?? 0),
    realisasi_spk: Number(s.realisasi_spk ?? 0),
    progress_percentage: Number(s.progress_percentage ?? 0),
    keterangan: s.keterangan ?? null,
    image_url_1: s.image_url_1 ?? null,
    image_url_2: s.image_url_2 ?? null,
    image_url_3: s.image_url_3 ?? null,
    pdf_url_1: s.pdf_url_1 ?? null,
    pdf_url_2: s.pdf_url_2 ?? null,
    pdf_url_3: s.pdf_url_3 ?? null,
    created_at: String(s.createdAt ?? s.created_at ?? ""),
    updated_at: String(s.updatedAt ?? s.updated_at ?? ""),
  }))

  // Calculate sisa nilai kontrak for each kontrak
  const kontrakWithSisa = kontrakData.map((kontrak) => {
    const spkForKontrak = spkData.filter((spk) => spk.kontrak_payung_id === kontrak.id)
    const totalRealisasi = spkForKontrak.reduce((sum, spk) => sum + (spk.realisasi_spk || 0), 0)
    const sisaNilaiKontrak = kontrak.nilai_kontrak - totalRealisasi
    return { ...kontrak, sisa_nilai_kontrak: sisaNilaiKontrak }
  })

  const notifikasiCount = await db.collection("notifikasi").countDocuments({})

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader userName={profile?.full_name || user.email || "User"} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Monitoring</h2>
            <p className="text-slate-600">Kelola kontrak dan laporan proyek konstruksi Anda</p>
          </div>
          <Link href="/dashboard/kontrak/new">
            <Button size="lg" className="gap-2 bg-[#4CD964] hover:bg-[#43c85a]">
              <Plus className="h-5 w-5" />
              Kontrak Baru
            </Button>
          </Link>
        </div>

        <DashboardStats kontrakList={kontrakWithSisa} spkList={spkData} notifikasiCount={notifikasiCount || 0} />

        <div className="mt-8">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Daftar Kontrak Payung</h3>
          <KontrakList kontrakList={kontrakWithSisa} />
        </div>
      </main>
    </div>
  )
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
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

  const { data: kontrakList } = await supabase
    .from("kontrak_payung")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<KontrakPayung[]>()

  const kontrakData = kontrakList || []

  const { data: allSPK } = await supabase.from("spk").select("*").returns<SPK[]>()

  const spkData = allSPK || []

  // Calculate sisa nilai kontrak for each kontrak
  const kontrakWithSisa = kontrakData.map((kontrak) => {
    const spkForKontrak = spkData.filter((spk) => spk.kontrak_payung_id === kontrak.id)
    const totalRealisasi = spkForKontrak.reduce((sum, spk) => sum + (spk.realisasi_spk || 0), 0)
    const sisaNilaiKontrak = kontrak.nilai_kontrak - totalRealisasi
    return { ...kontrak, sisa_nilai_kontrak: sisaNilaiKontrak }
  })

  const { count: notifikasiCount } = await supabase.from("notifikasi").select("*", { count: "exact", head: true })

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

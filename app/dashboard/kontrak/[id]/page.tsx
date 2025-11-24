import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { KontrakDetailHeader } from "@/components/kontrak-detail-header"
import { SPKAccordion } from "@/components/spk-accordion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Edit } from "lucide-react"
import Link from "next/link"
import type { KontrakPayung, SPK, Notifikasi } from "@/lib/types"

export default async function KontrakDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch kontrak payung
  const { data: kontrak } = await supabase
    .from("kontrak_payung")
    .select("*")
    .eq("id", params.id)
    .single<KontrakPayung>()

  if (!kontrak) {
    redirect("/dashboard")
  }

  // Fetch all SPK for this kontrak
  const { data: spkList } = await supabase
    .from("spk")
    .select("*")
    .eq("kontrak_payung_id", params.id)
    .order("no_spk", { ascending: true })
    .returns<SPK[]>()

  const spkData = spkList || []

  // Fetch all notifikasi for all SPK
  const spkIds = spkData.map((spk: { id: any }) => spk.id)
  const { data: notifikasiList } = await supabase
    .from("notifikasi")
    .select("*")
    .in("spk_id", spkIds)
    .returns<Notifikasi[]>()

  const notifikasiData = notifikasiList || []

  // Group notifikasi by spk_id
  const notifikasiBySpk = notifikasiData.reduce(
    (acc: { [x: string]: any[] }, notif: { spk_id: string | number }) => {
      if (!acc[notif.spk_id]) {
        acc[notif.spk_id] = []
      }
      acc[notif.spk_id].push(notif)
      return acc
    },
    {} as Record<string, Notifikasi[]>,
  )

  // Combine SPK with their notifikasi
  const spkWithNotifikasi = spkData.map((spk) => ({
    ...spk,
    notifikasi: notifikasiBySpk[spk.id] || [],
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader userName={profile?.full_name || user.email || "User"} />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Button>
        </Link>

        {/* Kontrak Header */}
        <KontrakDetailHeader kontrak={kontrak} sisaNilaiKontrak={kontrak.nilai_kontrak - (spkData.reduce((sum, spk) => sum + (spk.realisasi_spk || 0), 0))} />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Link href={`/dashboard/kontrak/${params.id}/edit`}>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Edit className="h-4 w-4" />
              Edit Kontrak
            </Button>
          </Link>
          <Link href={`/dashboard/kontrak/${params.id}/spk/new`}>
            <Button className="gap-2 bg-[#4CD964] hover:bg-[#43c85a]">
              <Plus className="h-4 w-4" />
              Tambah SPK
            </Button>
          </Link>
        </div>

        {/* SPK List with Accordion */}
        <div>
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Daftar SPK</h3>
          {spkWithNotifikasi.length > 0 ? (
            <SPKAccordion spkList={spkWithNotifikasi} kontrakId={params.id} />
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <p className="text-slate-500 text-lg mb-2">Belum ada SPK</p>
              <p className="text-slate-400 text-sm mb-4">Tambahkan SPK pertama untuk kontrak ini</p>
              <Link href={`/dashboard/kontrak/${params.id}/spk/new`}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tambah SPK
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { NotifikasiForm } from "@/components/notifikasi-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function NewNotifikasiPage({
  params,
}: {
  params: { id: string; spkId: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Verify SPK exists
  const { data: spk } = await supabase.from("spk").select("*, kontrak_payung(*)").eq("id", params.spkId).single()

  if (!spk) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader userName={profile?.full_name || user.email || "User"} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href={`/dashboard/kontrak/${params.id}`}>
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Detail Kontrak
          </Button>
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Tambah Notifikasi Baru</h1>
          <p className="text-slate-600">Untuk SPK: {spk.judul_spk}</p>
        </div>

        <NotifikasiForm spkId={params.spkId} kontrakId={params.id} />
      </main>
    </div>
  )
}

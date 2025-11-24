import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { KontrakForm } from "@/components/kontrak-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { KontrakPayung } from "@/lib/types"

export default async function EditKontrakPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch kontrak
  const { data: kontrak } = await supabase
    .from("kontrak_payung")
    .select("*")
    .eq("id", params.id)
    .single<KontrakPayung>()

  if (!kontrak) {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Edit Kontrak Payung</h1>
          <p className="text-slate-600">Update informasi kontrak payung</p>
        </div>

        <KontrakForm userId={user.id} initialData={kontrak} />
      </main>
    </div>
  )
}

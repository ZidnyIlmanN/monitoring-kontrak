import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDb } from "@/lib/mongodb/client"
import { ObjectId } from "mongodb"
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

  // Await params per Next.js dynamic route requirement
  const { id, spkId } = await Promise.resolve(params)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Verify SPK exists (MongoDB)
  const db = await getDb()
  let spk: any = null
  try {
    const s = await db.collection("spk").findOne({ _id: new ObjectId(spkId) })
    if (!s) redirect("/dashboard")
    spk = { ...s, id: s._id.toString() }
  } catch (e) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader userName={profile?.full_name || user.email || "User"} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href={`/dashboard/kontrak/${id}`}>
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Detail Kontrak
          </Button>
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Tambah Notifikasi Baru</h1>
          <p className="text-slate-600">Untuk SPK: {spk.judul_spk}</p>
        </div>

        <NotifikasiForm spkId={spkId} kontrakId={id} />
      </main>
    </div>
  )
}

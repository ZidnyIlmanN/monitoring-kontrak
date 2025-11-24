import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDb } from "@/lib/mongodb/client"
import { ObjectId } from "mongodb"
import { DashboardHeader } from "@/components/dashboard-header"
import { NotifikasiForm } from "@/components/notifikasi-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Notifikasi } from "@/lib/types"

export default async function EditNotifikasiPage({
  params,
}: {
  params: { id: string; spkId: string; notifId: string }
}) {
  const supabase = await createClient()

  // Await params per Next.js dynamic routes requirement
  const { id, spkId, notifId } = await Promise.resolve(params)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch notifikasi from MongoDB and serialize to plain object
  const db = await getDb()
  let notifikasi: Notifikasi | null = null
  try {
    const n = await db.collection("notifikasi").findOne({ _id: new ObjectId(notifId) })
    if (!n) {
      redirect("/dashboard")
    }
    notifikasi = {
      id: String(n._id?.toString ? n._id.toString() : n.id || ""),
      spk_id: String(n.spk_id ?? ""),
      no_notif: String(n.no_notif ?? ""),
      judul_notifikasi: String(n.judul_notifikasi ?? ""),
      lokasi: String(n.lokasi ?? ""),
      image_url: n.image_url ?? null,
      pdf_url: n.pdf_url ?? null,
      created_at: String(n.createdAt ?? n.created_at ?? ""),
      updated_at: String(n.updatedAt ?? n.updated_at ?? ""),
    }
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Edit Notifikasi</h1>
          <p className="text-slate-600">Update informasi notifikasi</p>
        </div>

        <NotifikasiForm spkId={spkId} kontrakId={id} initialData={notifikasi} />
      </main>
    </div>
  )
}

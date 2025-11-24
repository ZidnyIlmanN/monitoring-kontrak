import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDb } from "@/lib/mongodb/client"
import { ObjectId } from "mongodb"
import { DashboardHeader } from "@/components/dashboard-header"
import { KontrakForm } from "@/components/kontrak-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { KontrakPayung } from "@/lib/types"

export default async function EditKontrakPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Await params as required by Next.js dynamic routes
  const { id } = await Promise.resolve(params)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch kontrak from MongoDB and serialize to plain object
  const db = await getDb()
  let kontrak: KontrakPayung | null = null
  try {
    const k = await db.collection("kontrakPayung").findOne({ _id: new ObjectId(id) })
    if (!k) redirect("/dashboard")
    kontrak = {
      id: String(k._id?.toString ? k._id.toString() : k.id || ""),
      user_id: String(k.user_id ?? k.owner ?? ""),
      nama_kontrak_payung: String(k.nama_kontrak_payung ?? k.nama_kontrak ?? ""),
      nomor_oas: String(k.nomor_oas ?? ""),
      waktu_perjanjian: String(k.waktu_perjanjian ?? k.waktuPerjanjian ?? ""),
      periode_kontrak: String(k.periode_kontrak ?? ""),
      nilai_kontrak: Number(k.nilai_kontrak ?? 0),
      sisa_nilai_kontrak: k.sisa_nilai_kontrak ?? undefined,
      created_at: String(k.createdAt ?? k.created_at ?? ""),
      updated_at: String(k.updatedAt ?? k.updated_at ?? ""),
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Edit Kontrak Payung</h1>
          <p className="text-slate-600">Update informasi kontrak payung</p>
        </div>

        <KontrakForm userId={user.id} initialData={kontrak} />
      </main>
    </div>
  )
}

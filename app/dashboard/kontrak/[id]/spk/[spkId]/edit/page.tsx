import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDb } from "@/lib/mongodb/client"
import { ObjectId } from "mongodb"
import { DashboardHeader } from "@/components/dashboard-header"
import { SPKForm } from "@/components/spk-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { SPK } from "@/lib/types"

export default async function EditSPKPage({ params }: { params: { id: string; spkId: string } }) {
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

  // Fetch SPK from MongoDB and serialize to plain object
  const db = await getDb()
  let spk: SPK | null = null
  try {
    const s = await db.collection("spk").findOne({ _id: new ObjectId(spkId) })
    if (!s) redirect("/dashboard")
    spk = {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Edit SPK</h1>
          <p className="text-slate-600">Update informasi SPK</p>
        </div>

        <SPKForm kontrakId={id} initialData={spk} />
      </main>
    </div>
  )
}

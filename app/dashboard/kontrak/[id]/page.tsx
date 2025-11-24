import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { KontrakDetailHeader } from "@/components/kontrak-detail-header"
import { SPKAccordion } from "@/components/spk-accordion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Edit } from "lucide-react"
import Link from "next/link"
import type { KontrakPayung, SPK, Notifikasi, SPKWithNotifikasi } from "@/lib/types"
import { getDb } from "@/lib/mongodb/client"
import { ObjectId } from "mongodb"

export default async function KontrakDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Next.js requires awaiting params before using their properties in dynamic routes.
  // Use `await Promise.resolve(params)` to satisfy the runtime check while keeping behavior identical.
  const { id } = await Promise.resolve(params)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  // Fetch kontrak payung from MongoDB with proper typing
  const db = await getDb()
  let kontrak: KontrakPayung | null = null
  try {
    const oid = new ObjectId(id)
    const kdoc = await db
      .collection<Partial<KontrakPayung> & { _id: ObjectId }>("kontrakPayung")
      .findOne({ _id: oid })
    if (!kdoc) redirect("/dashboard")
    kontrak = ({ ...(kdoc as any), id: kdoc._id.toString() } as KontrakPayung)
  } catch (e) {
    redirect("/dashboard")
  }

  // Fetch all SPK for this kontrak with typing
  const spkDocs = await db
    .collection<Partial<SPK> & { _id: ObjectId }>("spk")
    .find({ kontrak_payung_id: id })
    .sort({ no_spk: 1 })
    .toArray()
  // Serialize SPK documents to plain objects (strip BSON/ObjectId)
  const spkData: SPK[] = (spkDocs || []).map((s: any) => ({
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
  } as SPK))

  // Fetch all notifikasi for all SPK (typed) and serialize to plain objects
  const spkIds = spkData.map((spk) => spk.id)
  const notifikasiDocs =
    spkIds.length > 0
      ? await db.collection<Partial<Notifikasi> & { _id: ObjectId }>("notifikasi").find({ spk_id: { $in: spkIds } }).toArray()
      : []

  const notifikasiData: Notifikasi[] = (notifikasiDocs || []).map((n: any) => ({
    id: String(n._id?.toString ? n._id.toString() : n.id || ""),
    spk_id: String(n.spk_id ?? ""),
    no_notif: String(n.no_notif ?? ""),
    judul_notifikasi: String(n.judul_notifikasi ?? ""),
    lokasi: String(n.lokasi ?? ""),
    image_url: n.image_url ?? null,
    pdf_url: n.pdf_url ?? null,
    created_at: String(n.createdAt ?? n.created_at ?? ""),
    updated_at: String(n.updatedAt ?? n.updated_at ?? ""),
  }))

  // Group notifikasi by spk_id with correct types
  const notifikasiBySpk = notifikasiData.reduce((acc: Record<string, Notifikasi[]>, notif: Notifikasi) => {
    if (!acc[notif.spk_id]) {
      acc[notif.spk_id] = []
    }
    acc[notif.spk_id].push(notif)
    return acc
  }, {} as Record<string, Notifikasi[]>)

  // Combine SPK with their notifikasi
  const spkWithNotifikasi: SPKWithNotifikasi[] = spkData.map((spk) => ({
    ...spk,
    notifikasi: notifikasiBySpk[spk.id] || [],
  } as SPKWithNotifikasi))

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
            <Link href={`/dashboard/kontrak/${id}/edit`}>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Edit className="h-4 w-4" />
              Edit Kontrak
            </Button>
          </Link>
          <Link href={`/dashboard/kontrak/${id}/spk/new`}>
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
            <SPKAccordion spkList={spkWithNotifikasi} kontrakId={id} />
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <p className="text-slate-500 text-lg mb-2">Belum ada SPK</p>
              <p className="text-slate-400 text-sm mb-4">Tambahkan SPK pertama untuk kontrak ini</p>
                <Link href={`/dashboard/kontrak/${id}/spk/new`}>
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

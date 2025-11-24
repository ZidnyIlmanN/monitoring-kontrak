import { createClient } from "@/lib/supabase/server"
import { getDb } from "@/lib/mongodb/client"
import { ObjectId } from "mongodb"
import { AutoPrint } from "@/components/auto-print"

type Kontrak = {
  id: string
  nama_kontrak_payung?: string | null
  nomor_oas?: string | null
  periode_kontrak?: string | null
  waktu_perjanjian?: string | null
  nilai_kontrak?: number | string | null
  keterangan?: string | null
}

type SPK = {
  id: string
  kontrak_payung_id: string
  no_spk?: string | null
  judul_spk?: string | null
  durasi_spk?: string | null
  nilai_rekapitulasi_estimasi_biaya?: number | string | null
  realisasi_spk?: number | string | null
  progress_percentage?: number | null
  keterangan?: string | null
  image_url_1?: string | null
  image_url_2?: string | null
  image_url_3?: string | null
  pdf_url_1?: string | null
  pdf_url_2?: string | null
  pdf_url_3?: string | null
}

type Notifikasi = {
  id: string
  spk_id: string
  no_notif?: string | null
  judul_notifikasi?: string | null
  lokasi?: string | null
  image_url?: string | null
  pdf_url?: string | null
}

function toNumber(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function formatCurrencyIDR(v: unknown) {
  const n = toNumber(v)
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await getDb()

  // Ambil data kontrak
  let kontrak: any = null
  try {
    const k = await db.collection("kontrakPayung").findOne({ _id: new ObjectId(id) })
    if (!k) {
      return (
        <main className="p-8">
          <h1 className="text-xl font-semibold mb-2">Gagal memuat data kontrak</h1>
          <p className="text-sm text-muted-foreground">ID: {id}</p>
        </main>
      )
    }
    kontrak = { ...k, id: k._id.toString() }
  } catch (e) {
    return (
      <main className="p-8">
        <h1 className="text-xl font-semibold mb-2">Gagal memuat data kontrak</h1>
        <p className="text-sm text-muted-foreground">ID: {id}</p>
      </main>
    )
  }

  // Ambil semua SPK di kontrak ini dan serialisasi ke objek plain
  const spkDocs = await db.collection("spk").find({ kontrak_payung_id: id }).sort({ no_spk: 1 }).toArray()
  const spks: SPK[] = (spkDocs || []).map((s: any) => ({
    id: String(s._id?.toString ? s._id.toString() : s.id || ""),
    kontrak_payung_id: String(s.kontrak_payung_id ?? ""),
    no_spk: String(s.no_spk ?? ""),
    judul_spk: String(s.judul_spk ?? ""),
    durasi_spk: String(s.durasi_spk ?? ""),
    nilai_rekapitulasi_estimasi_biaya: s.nilai_rekapitulasi_estimasi_biaya ?? 0,
    realisasi_spk: s.realisasi_spk ?? 0,
    progress_percentage: s.progress_percentage ?? 0,
    keterangan: s.keterangan ?? null,
    image_url_1: s.image_url_1 ?? null,
    image_url_2: s.image_url_2 ?? null,
    image_url_3: s.image_url_3 ?? null,
    pdf_url_1: s.pdf_url_1 ?? null,
    pdf_url_2: s.pdf_url_2 ?? null,
    pdf_url_3: s.pdf_url_3 ?? null,
  } as SPK))

  const spkIds = spks.map((s) => s.id)

  // Ambil semua notifikasi sekaligus lalu serialisasi dan kelompokkan per SPK
  let notifikasiBySpk = new Map<string, Notifikasi[]>()
  if (spkIds.length > 0) {
    const notifsDocs = await db.collection("notifikasi").find({ spk_id: { $in: spkIds } }).toArray()
    const notifs: Notifikasi[] = (notifsDocs || []).map((n: any) => ({
      id: String(n._id?.toString ? n._id.toString() : n.id || ""),
      spk_id: String(n.spk_id ?? ""),
      no_notif: String(n.no_notif ?? ""),
      judul_notifikasi: String(n.judul_notifikasi ?? ""),
      lokasi: String(n.lokasi ?? ""),
      image_url: n.image_url ?? null,
      pdf_url: n.pdf_url ?? null,
    }))

    notifikasiBySpk = notifs.reduce((map, n) => {
      const arr = map.get(n.spk_id) || []
      arr.push(n)
      map.set(n.spk_id, arr)
      return map
    }, new Map<string, Notifikasi[]>())
  }

  const totalEstimasi = spks.reduce((acc, s) => acc + toNumber(s.nilai_rekapitulasi_estimasi_biaya), 0)
  const totalRealisasi = spks.reduce((acc, s) => acc + toNumber(s.realisasi_spk), 0)
  const rataProgress = spks.length
    ? Math.round(spks.reduce((acc, s) => acc + (s.progress_percentage ?? 0), 0) / spks.length)
    : 0

  return (
    <html lang="id">
      <body className="bg-white text-black">
        {/* Komponen client kecil yang memicu window.print() setelah render */}
        <AutoPrint />

        <main className="mx-auto max-w-5xl p-8 print:p-0">
          {/* Header laporan */}
          <section className="mb-6 border-b pb-4">
            <h1 className="text-2xl font-semibold text-center">Laporan Kontrak Payung</h1>
            <p className="text-center text-sm text-muted-foreground">RAM Civil Monitoring</p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <div>
                  <span className="font-medium">Nama Kontrak:</span> {kontrak?.nama_kontrak_payung || "-"}
                </div>
                <div>
                  <span className="font-medium">Nomor OAS:</span> {kontrak?.nomor_oas || "-"}
                </div>
                <div>
                  <span className="font-medium">Periode:</span> {kontrak?.periode_kontrak || "-"}
                </div>
              </div>
              <div>
            <div>
              <span className="font-medium">Nilai Kontrak:</span> {formatCurrencyIDR(kontrak?.nilai_kontrak)}
            </div>
            <div>
              <span className="font-medium">Sisa Nilai Kontrak:</span> {formatCurrencyIDR(toNumber(kontrak?.nilai_kontrak) - totalRealisasi)}
            </div>
            <div>
              <span className="font-medium">Jumlah SPK:</span> {spks.length}
            </div>
            <div>
              <span className="font-medium">Rata-rata Progress:</span> {rataProgress}%
            </div>
            <div>
              <span className="font-medium">Total Estimasi Biaya:</span> {formatCurrencyIDR(totalEstimasi)}
            </div>
            <div>
              <span className="font-medium">Total Realisasi SPK:</span> {formatCurrencyIDR(totalRealisasi)}
            </div>
          </div>
            </div>
          </section>

          {/* Tabel SPK */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Daftar SPK</h2>
            <table className="w-full text-sm border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">No</th>
                  <th className="p-2 border">No. SPK</th>
                  <th className="p-2 border">Judul SPK</th>
                  <th className="p-2 border">Durasi SPK</th>
                  <th className="p-2 border text-right">Nilai Rekap Estimasi Biaya</th>
                  <th className="p-2 border text-right">Realisasi SPK</th>
                  <th className="p-2 border text-center">Progress</th>
                  <th className="p-2 border">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {spks.map((s, idx) => (
                  <tr key={s.id} className="align-top">
                    <td className="p-2 border">{idx + 1}</td>
                    <td className="p-2 border">{s.no_spk || "-"}</td>
                    <td className="p-2 border">{s.judul_spk || "-"}</td>
                    <td className="p-2 border">{s.durasi_spk || "-"}</td>
                    <td className="p-2 border text-right">{formatCurrencyIDR(s.nilai_rekapitulasi_estimasi_biaya)}</td>
                    <td className="p-2 border text-right">{formatCurrencyIDR(s.realisasi_spk)}</td>
                    <td className="p-2 border text-center">{s.progress_percentage ?? 0}%</td>
                    <td className="p-2 border">{s.keterangan || "-"}</td>
                  </tr>
                ))}
                {spks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-muted-foreground">
                      Belum ada SPK
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-medium">
                  <td className="p-2 border text-right" colSpan={4}>
                    Total
                  </td>
                  <td className="p-2 border text-right">{formatCurrencyIDR(totalEstimasi)}</td>
                  <td className="p-2 border text-right">{formatCurrencyIDR(totalRealisasi)}</td>
                  <td className="p-2 border text-center">{rataProgress}%</td>
                  <td className="p-2 border">—</td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* Bukti & Notifikasi per SPK */}
          <section className="space-y-6">
            {spks.map((s, idx) => {
              const list = notifikasiBySpk.get(s.id) || []
              const buktiImages = [s.image_url_1, s.image_url_2, s.image_url_3].filter(Boolean) as string[]
              const buktiPdfs = [s.pdf_url_1, s.pdf_url_2, s.pdf_url_3].filter(Boolean) as string[]
              return (
                <div key={s.id} className="break-inside-avoid">
                  <h3 className="font-semibold mb-2">
                    SPK {idx + 1}: {s.judul_spk || s.no_spk || "-"}
                  </h3>

                  {(buktiImages.length > 0 || buktiPdfs.length > 0) && (
                    <div className="mb-3">
                      <div className="text-sm font-medium mb-1">Bukti SPK</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {buktiImages.map((src, i) => (
                          <figure key={i} className="border p-2 text-center">
                            {/* gunakan placeholder jika cross-origin block */}
                            <img
                              src={src || "/placeholder.svg"}
                              alt={`Bukti SPK ${i + 1}`}
                              className="mx-auto max-h-40 object-contain"
                            />
                            <figcaption className="text-xs mt-1">Foto {i + 1}</figcaption>
                          </figure>
                        ))}
                        {buktiPdfs.map((href, i) => (
                          <a
                            key={i}
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="border p-3 text-center text-blue-600 underline"
                          >
                            Lihat PDF {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-medium mb-1">Data Notifikasi</div>
                    <table className="w-full text-sm border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 border">No. Notif</th>
                          <th className="p-2 border">Judul Notifikasi</th>
                          <th className="p-2 border">Lokasi</th>
                          <th className="p-2 border">Lampiran</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((n) => (
                          <tr key={n.id}>
                            <td className="p-2 border">{n.no_notif || "-"}</td>
                            <td className="p-2 border">{n.judul_notifikasi || "-"}</td>
                            <td className="p-2 border">{n.lokasi || "-"}</td>
                            <td className="p-2 border">
                              <div className="flex flex-col gap-1">
                                {n.image_url && (
                                  <img
                                    src={n.image_url || "/placeholder.svg"}
                                    alt="Lampiran Foto"
                                    className="max-h-32 object-contain border"
                                  />
                                )}
                                {n.pdf_url && (
                                  <a
                                    href={n.pdf_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    Buka PDF
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {list.length === 0 && (
                          <tr>
                            <td className="p-3 text-center text-muted-foreground" colSpan={4}>
                              Belum ada notifikasi
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </section>

          <footer className="mt-10 text-xs text-center text-muted-foreground print:mt-6">
            Dokumen ini dihasilkan secara otomatis dari sistem RAM Civil Monitoring. Tanggal cetak:{" "}
            {new Date().toLocaleDateString("id-ID")}
          </footer>
        </main>
      </body>
    </html>
  )
}

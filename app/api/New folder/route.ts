import { NextResponse, type NextRequest } from "next/server"
import { generatePDF } from "@/lib/pdf-generator"
import type { Report } from "@/lib/types"
import { getDb } from "@/lib/mongodb/client"
import { createClient as createSupabaseClient } from "@/lib/supabase/server"

/*
  Endpoint POST untuk menerima `Report`.
  - Upload foto (jika ada) ke Supabase Storage (bucket: "reports").
  - Simpan metadata laporan ke MongoDB (collection: "reports").
  - Tetap menghasilkan PDF dari data laporan dan mengembalikannya.

  Catatan:
  - Pastikan env `MONGODB_URI` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`/`NEXT_PUBLIC_SUPABASE_URL` sudah terpasang.
  - Jika Supabase storage memerlukan kunci service, gunakan key server-side yang aman (tidak di-commit).
*/

export async function POST(request: NextRequest) {
  try {
    const reportData = (await request.json()) as Report

    if (!reportData) {
      return new NextResponse("Data laporan tidak ditemukan", { status: 400 })
    }

    // 1) Jika ada foto dalam reportData, upload ke Supabase Storage
    //    Di sini kita asumsikan reportData.images?: { filename: string; base64: string }[]
    const supabase = await createSupabaseClient()
    const uploadedFiles: Array<{ path: string; publicUrl?: string }> = []

    if ((reportData as any).images && Array.isArray((reportData as any).images)) {
      const images = (reportData as any).images as Array<{ filename: string; base64: string }>
      for (const img of images) {
        const buffer = Buffer.from(img.base64, "base64")
        const filePath = `reports/${Date.now()}_${img.filename}`

        const { data, error: uploadError } = await supabase.storage.from("reports").upload(filePath, buffer, {
          contentType: "image/jpeg",
          upsert: false,
        })

        if (uploadError) {
          console.error("Supabase upload error:", uploadError)
          // lanjutkan tanpa menghentikan seluruh proses, namun catat error
          uploadedFiles.push({ path: filePath })
          continue
        }

        // dapatkan public url (jika bucket publik) atau simpan path
        const { data: publicData } = supabase.storage.from("reports").getPublicUrl(data.path)
        uploadedFiles.push({ path: data.path, publicUrl: publicData.publicUrl })
      }
    }

    // 2) Simpan metadata ke MongoDB
    const db = await getDb()
    const doc: any = {
      ...reportData,
      uploadedFiles,
      createdAt: new Date(),
    }

    // Simpan ke koleksi `reports` (ubah jika ingin simpan ke koleksi lain seperti `kontrakPayung`)
    const res = await db.collection("reports").insertOne(doc)

    // 3) Generate PDF seperti sebelumnya
    const pdfBuffer = await generatePDF(reportData)
    const pdfUint8Array = new Uint8Array(pdfBuffer)

    // 4) Kembalikan PDF dan id dokumen MongoDB sebagai header/JSON
    const response = new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="laporan-monitoring.pdf"`,
        "X-Inserted-Id": res.insertedId.toString(),
      },
    })

    return response
  } catch (error) {
    console.error("Gagal memproses laporan:", error)
    return new NextResponse("Gagal memproses laporan", { status: 500 })
  }
}
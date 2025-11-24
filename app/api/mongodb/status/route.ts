import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb/client"

export async function GET() {
  try {
    const db = await getDb()

    const collectionsToCheck = [
      "kontrakPayung",
      "notifikasi",
      "profiles",
      "spk",
    ]

    const counts: Record<string, number> = {}
    for (const name of collectionsToCheck) {
      const col = db.collection(name)
      // countDocuments may be expensive for very large collections; this is for quick verification
      counts[name] = await col.countDocuments({})
    }

    return NextResponse.json({ ok: true, counts })
  } catch (error) {
    console.error("MongoDB status check failed:", error)
    return new NextResponse("Gagal terhubung ke MongoDB", { status: 500 })
  }
}

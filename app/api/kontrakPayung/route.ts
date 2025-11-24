import { NextResponse, type NextRequest } from "next/server"
import { getDb } from "@/lib/mongodb/client"
import { ObjectId } from "mongodb"
import { createClient as createSupabaseClient } from "@/lib/supabase/server"

// CRUD endpoint for collection `kontrakPayung`.
// - GET /api/kontrakPayung            => list documents (optional ?limit=N)
// - GET /api/kontrakPayung?id=<id>    => get single document by _id
// - POST /api/kontrakPayung           => create document (JSON body)
// - PUT /api/kontrakPayung?id=<id>    => update document (JSON body)
// - DELETE /api/kontrakPayung?id=<id> => delete document by _id

function parseId(id?: string | null) {
  if (!id) return null
  try {
    return new ObjectId(id)
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    const db = await getDb()
    const col = db.collection("kontrakPayung")

    if (id) {
      const oid = parseId(id)
      if (!oid) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
      const doc = await col.findOne({ _id: oid })
      if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })
      return NextResponse.json({ ok: true, doc })
    }

    const limit = Number(url.searchParams.get("limit") || "50")
    const docs = await col.find({}).limit(Math.min(limit, 1000)).toArray()
    return NextResponse.json({ ok: true, count: docs.length, docs })
  } catch (err) {
    console.error("kontrakPayung GET error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check via Supabase session (cookies)
    const supabase = await createSupabaseClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await request.json()
    const db = await getDb()
    const col = db.collection("kontrakPayung")

    // Add createdAt and owner if not present
    if (!payload.createdAt) payload.createdAt = new Date()
    payload.owner = userData.user.id

    const res = await col.insertOne(payload)
    return NextResponse.json({ ok: true, insertedId: res.insertedId.toString() }, { status: 201 })
  } catch (err) {
    console.error("kontrakPayung POST error:", err)
    return NextResponse.json({ error: "Invalid payload or server error" }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createSupabaseClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    const oid = parseId(id)
    if (!oid) return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 })

    const payload = await request.json()
    // Prevent updating _id
    delete payload._id

    const db = await getDb()
    const col = db.collection("kontrakPayung")
    // Optionally ensure owner matches user before updating
    const res = await col.updateOne({ _id: oid }, { $set: payload })
    if (res.matchedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ ok: true, modifiedCount: res.modifiedCount })
  } catch (err) {
    console.error("kontrakPayung PUT error:", err)
    return NextResponse.json({ error: "Invalid payload or server error" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createSupabaseClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    const oid = parseId(id)
    if (!oid) return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 })

    const db = await getDb()
    const col = db.collection("kontrakPayung")
    const res = await col.deleteOne({ _id: oid })
    if (res.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ ok: true, deletedCount: res.deletedCount })
  } catch (err) {
    console.error("kontrakPayung DELETE error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

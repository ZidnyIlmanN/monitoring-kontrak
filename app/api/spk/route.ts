import { NextResponse, type NextRequest } from "next/server"
import { getDb } from "@/lib/mongodb/client"
import { ObjectId } from "mongodb"
import { createClient as createSupabaseClient } from "@/lib/supabase/server"

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
    const col = db.collection("spk")

    if (id) {
      const oid = parseId(id)
      // allow fetching by string id (ObjectId) or by kontrak_payung_id
      if (oid) {
        const doc = await col.findOne({ _id: oid })
        if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })
        return NextResponse.json({ ok: true, doc })
      }

      // fallback: find by kontrak_payung_id
      const docs = await col.find({ kontrak_payung_id: id }).toArray()
      return NextResponse.json({ ok: true, docs })
    }

    const docs = await col.find({}).limit(1000).toArray()
    return NextResponse.json({ ok: true, docs })
  } catch (err) {
    console.error("spk GET error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth
    const supabase = await createSupabaseClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await request.json()
    const db = await getDb()
    const col = db.collection("spk")

    if (!payload.createdAt) payload.createdAt = new Date()
    payload.owner = userData.user.id

    const res = await col.insertOne(payload)
    return NextResponse.json({ ok: true, insertedId: res.insertedId.toString() }, { status: 201 })
  } catch (err) {
    console.error("spk POST error:", err)
    return NextResponse.json({ error: "Invalid payload or server error" }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    const oid = parseId(id)
    if (!oid) return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 })

    const payload = await request.json()
    delete payload._id

    const db = await getDb()
    const col = db.collection("spk")
    const res = await col.updateOne({ _id: oid }, { $set: payload })
    if (res.matchedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ ok: true, modifiedCount: res.modifiedCount })
  } catch (err) {
    console.error("spk PUT error:", err)
    return NextResponse.json({ error: "Invalid payload or server error" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    const oid = parseId(id)
    if (!oid) return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 })

    const db = await getDb()
    const col = db.collection("spk")
    const res = await col.deleteOne({ _id: oid })
    if (res.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ ok: true, deletedCount: res.deletedCount })
  } catch (err) {
    console.error("spk DELETE error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

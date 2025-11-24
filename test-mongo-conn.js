import { MongoClient } from "mongodb"

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error("Set MONGODB_URI in environment first (or in .env.local)")
    process.exit(1)
  }

  const client = new MongoClient(uri)
  try {
    await client.connect()
    console.log("Connected to MongoDB")
    const admin = client.db().admin()
    const dbs = await admin.listDatabases()
    console.log("Databases:", dbs.databases.map(d => d.name))

    // If MONGODB_DB env is set, list collections in that DB
    const dbName = process.env.MONGODB_DB
    if (dbName) {
      const db = client.db(dbName)
      const cols = await db.listCollections().toArray()
      console.log(`Collections in ${dbName}:`, cols.map(c => c.name))
    }
  } catch (err) {
    console.error("Connection/test failed:", err)
    process.exitCode = 2
  } finally {
    await client.close()
  }
}

main()

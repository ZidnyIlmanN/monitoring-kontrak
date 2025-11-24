import { MongoClient, type Db } from "mongodb"

const uri: string = process.env.MONGODB_URI!
const dbName = process.env.MONGODB_DB

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable. Set it in .env.local")
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

async function createClientPromise(): Promise<MongoClient> {
  // Create and connect a MongoClient. No TLS-permissive fallback kept here for security.
  const c = new MongoClient(uri)
  await c.connect()
  return c
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClientPromise()
  }
  clientPromise = global._mongoClientPromise
} else {
  clientPromise = createClientPromise()
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise
  // If dbName is undefined the driver will use the database specified in the URI
  return client.db(dbName || undefined)
}

export async function closeClient(): Promise<void> {
  const c = await clientPromise
  await c.close()
}

import { MongoClient, type MongoClientOptions } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables")
}

const uri = process.env.MONGODB_URI as string

// Options de connexion sécurisée
const options: MongoClientOptions = {
  tls: true,                    // Chiffrement TLS obligatoire
  tlsInsecure: false,           // Pas de bypass du certificat
  maxPoolSize: 10,              // Limite les connexions simultanées
  minPoolSize: 1,
  connectTimeoutMS: 10_000,     // Timeout connexion 10s
  socketTimeoutMS: 30_000,      // Timeout socket 30s
  serverSelectionTimeoutMS: 10_000,
  retryWrites: true,
  w: "majority",                // Write concern : attend confirmation majority
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // En dev : réutilise la connexion entre les hot-reloads
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri, options).connect()
  }
  clientPromise = global._mongoClientPromise as Promise<MongoClient>
} else {
  // En prod : nouvelle instance (Vercel Serverless Functions sont isolées)
  clientPromise = new MongoClient(uri, options).connect()
}

export async function getDb() {
  const client = await clientPromise
  return client.db("dzretour")
}

export default clientPromise
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "./storage/schema.js"; // ✅ FIXED PATH

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

/* ================= SERVERLESS SAFE CACHE ================= */
let client;
let db;

if (!global.pg) {
  client = postgres(connectionString, {
    max: 1,               // 🔥 REQUIRED for Vercel
    idle_timeout: 20,
    connect_timeout: 10,
  });

  db = drizzle(client, { schema });

  global.pg = { client, db };
} else {
  client = global.pg.client;
  db = global.pg.db;
}

export { db };

/* ================= CONNECTION TEST ================= */
export const connectDB = async () => {
  await client`SELECT 1`;
  console.log("✅ PostgreSQL connected");
};

/* ================= USER STORAGE ================= */
export const userStorage = {
  async create(data) {
    const [user] = await db.insert(schema.users).values(data).returning();
    return user;
  },

  async findById(id) {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id));
    return user ?? null;
  },

  async findByEmail(email) {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));
    return user ?? null;
  },

  async update(id, data) {
    await db.update(schema.users).set(data).where(eq(schema.users.id, id));
  },
};
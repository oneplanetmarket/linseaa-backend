import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "../shared/schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

/* ================= SERVERLESS SAFE CACHE ================= */
let client;
let db;

if (!global.pg) {
  client = postgres(connectionString, {
    max: 1,                 // 🔥 VERY IMPORTANT FOR VERCEL
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

  async updateCart(id, cart) {
    await db
      .update(schema.users)
      .set({ cart })
      .where(eq(schema.users.id, id));
  },

  async findAll() {
    return db.select().from(schema.users);
  },
};

/* ================= PRODUCT STORAGE ================= */
export const productStorage = {
  async create(data) {
    const [product] = await db
      .insert(schema.products)
      .values(data)
      .returning();
    return product;
  },

  async findById(id) {
    const [product] = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, id));
    return product ?? null;
  },

  async findAll() {
    return db.select().from(schema.products);
  },

  async updateStock(id, stock) {
    await db
      .update(schema.products)
      .set({ stock })
      .where(eq(schema.products.id, id));
  },

  async findByCategory(category) {
    return db
      .select()
      .from(schema.products)
      .where(eq(schema.products.category, category));
  },
};

/* ================= ORDER STORAGE ================= */
export const orderStorage = {
  async create(data) {
    const [order] = await db
      .insert(schema.orders)
      .values(data)
      .returning();
    return order;
  },

  async findById(id) {
    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id));
    return order ?? null;
  },

  async findByUserId(userId) {
    return db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.userId, userId));
  },

  async findAll() {
    return db.select().from(schema.orders);
  },

  async updateStatus(id, status) {
    await db
      .update(schema.orders)
      .set({ status })
      .where(eq(schema.orders.id, id));
  },

  async delete(id) {
    await db
      .delete(schema.orders)
      .where(eq(schema.orders.id, id));
  },
};

/* ================= ADDRESS STORAGE ================= */
export const addressStorage = {
  async create(data) {
    const [address] = await db
      .insert(schema.addresses)
      .values(data)
      .returning();
    return address;
  },

  async findByUserId(userId) {
    return db
      .select()
      .from(schema.addresses)
      .where(eq(schema.addresses.userId, userId));
  },

  async delete(id) {
    await db
      .delete(schema.addresses)
      .where(eq(schema.addresses.id, id));
  },
};

/* ================= PRODUCER APPLICATION ================= */
export const producerApplicationStorage = {
  async create(data) {
    const [application] = await db
      .insert(schema.producerApplications)
      .values(data)
      .returning();
    return application;
  },

  async findAll() {
    return db.select().from(schema.producerApplications);
  },

  async updateStatus(id, status) {
    await db
      .update(schema.producerApplications)
      .set({ status })
      .where(eq(schema.producerApplications.id, id));
  },
};
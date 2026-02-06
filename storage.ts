import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../shared/schema.ts';
import type { 
  User, InsertUser, 
  Product, InsertProduct,
  Order, InsertOrder,
  Address, InsertAddress,
  ProducerApplication, InsertProducerApplication
} from '../shared/schema.ts';

// PostgreSQL connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres client
const client = postgres(connectionString);

// Create drizzle instance
export const db = drizzle(client, { schema });

// User operations
export const userStorage = {
  async create(data: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(data).returning();
    return user;
  },

  async findById(id: number): Promise<User | null> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user || null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user || null;
  },

  async updateCart(id: number, cart: string[]): Promise<void> {
    await db.update(schema.users).set({ cart }).where(eq(schema.users.id, id));
  },

  async findAll(): Promise<User[]> {
    return await db.select().from(schema.users);
  }
};

// Product operations
export const productStorage = {
  async create(data: InsertProduct): Promise<Product> {
    const [product] = await db.insert(schema.products).values(data).returning();
    return product;
  },

  async findById(id: number): Promise<Product | null> {
    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    return product || null;
  },

  async findAll(): Promise<Product[]> {
    return await db.select().from(schema.products);
  },

  async updateStock(id: number, stock: number): Promise<void> {
    await db.update(schema.products).set({ stock }).where(eq(schema.products.id, id));
  },

  async findByCategory(category: string): Promise<Product[]> {
    return await db.select().from(schema.products).where(eq(schema.products.category, category));
  }
};

// Order operations
export const orderStorage = {
  async create(data: InsertOrder): Promise<Order> {
    const [order] = await db.insert(schema.orders).values(data).returning();
    return order;
  },

  async findById(id: number): Promise<Order | null> {
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return order || null;
  },

  async findByUserId(userId: number): Promise<Order[]> {
    return await db.select().from(schema.orders).where(eq(schema.orders.userId, userId));
  },

  async findAll(): Promise<Order[]> {
    return await db.select().from(schema.orders);
  },

  async updateStatus(id: number, status: string): Promise<void> {
    await db.update(schema.orders).set({ status }).where(eq(schema.orders.id, id));
  },

  async delete(id: number): Promise<void> {
    await db.delete(schema.orders).where(eq(schema.orders.id, id));
  }
};

// Address operations
export const addressStorage = {
  async create(data: InsertAddress): Promise<Address> {
    const [address] = await db.insert(schema.addresses).values(data).returning();
    return address;
  },

  async findById(id: number): Promise<Address | null> {
    const [address] = await db.select().from(schema.addresses).where(eq(schema.addresses.id, id));
    return address || null;
  },

  async findByUserId(userId: number): Promise<Address[]> {
    return await db.select().from(schema.addresses).where(eq(schema.addresses.userId, userId));
  },

  async delete(id: number): Promise<void> {
    await db.delete(schema.addresses).where(eq(schema.addresses.id, id));
  }
};

// Producer Application operations
export const producerApplicationStorage = {
  async create(data: InsertProducerApplication): Promise<ProducerApplication> {
    const [application] = await db.insert(schema.producerApplications).values(data).returning();
    return application;
  },

  async findAll(): Promise<ProducerApplication[]> {
    return await db.select().from(schema.producerApplications);
  },

  async updateStatus(id: number, status: string): Promise<void> {
    await db.update(schema.producerApplications).set({ status }).where(eq(schema.producerApplications.id, id));
  }
};

// Database connection test
export const connectDB = async () => {
  try {
    await client`SELECT 1`;
    console.log('PostgreSQL Database Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

export default db;
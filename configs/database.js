import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema.js';

// PostgreSQL connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres client
const client = postgres(connectionString);

// Create drizzle instance
export const db = drizzle(client, { schema });

// Connection test function
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
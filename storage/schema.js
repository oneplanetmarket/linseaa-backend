import {
    pgTable,
    uuid,
    varchar,
    text,
    numeric,
    boolean,
    timestamp,
    jsonb,
  } from "drizzle-orm/pg-core";
  
  /* ================= USERS ================= */
  
  export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
  
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password"),
  
    role: varchar("role", { length: 20 }).default("user"),
  
    profileSubmitted: boolean("profile_submitted").default(false),
  
    status: varchar("status", { length: 20 }).default("pending"),
    rejectionReason: text("rejection_reason"),
  
    contactEmail: varchar("contact_email", { length: 255 }),
    contactMobile: varchar("contact_mobile", { length: 20 }),
  
    linkedinUrl: text("linkedin_url"),
    linkedinYear: varchar("linkedin_year", { length: 10 }),
    linkedinConnections: varchar("linkedin_connections", { length: 50 }),
  
    paymentMethod: varchar("payment_method", { length: 50 }),
    paymentIdentifier: text("payment_identifier"),
  
    linkedinStatus: varchar("linkedin_status", { length: 30 }).default("not_submitted"),
    linkedinCredentials: jsonb("linkedin_credentials"),
  
    earningRate: numeric("earning_rate", { precision: 10, scale: 2 }).default("0"),
    walletBalance: numeric("wallet_balance", { precision: 12, scale: 2 }).default("0"),
  
    resetPasswordToken: text("reset_password_token"),
    resetPasswordExpires: timestamp("reset_password_expires"),
  
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });
  
  /* ================= TRANSACTIONS ================= */
  
  export const transactions = pgTable("transactions", {
    id: uuid("id").defaultRandom().primaryKey(),
  
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  
    transactionId: varchar("transaction_id", { length: 100 }).notNull(),
    type: varchar("type", { length: 10 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  
    remark: text("remark"),
    source: varchar("source", { length: 20 }).default("admin"),
    status: varchar("status", { length: 20 }).default("success"),
  
    createdAt: timestamp("created_at").defaultNow(),
  });
  
  /* ================= WITHDRAWALS ================= */
  
  export const withdrawals = pgTable("withdrawals", {
    id: uuid("id").defaultRandom().primaryKey(),
  
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
    paymentIdentifier: text("payment_identifier").notNull(),
  
    status: varchar("status", { length: 20 }).default("pending"),
    remark: text("remark"),
  
    createdAt: timestamp("created_at").defaultNow(),
  });
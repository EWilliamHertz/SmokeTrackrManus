import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products table - stores all smoking products
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["Cigar", "Cigarillo", "Cigarette", "Snus", "Other"]).notNull(),
  flavorDetail: text("flavorDetail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Purchases table - tracks all product purchases
 */
export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  purchaseDate: timestamp("purchaseDate").notNull(),
  quantity: int("quantity").notNull(),
  pricePerItem: decimal("pricePerItem", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

/**
 * Consumption table - tracks when products are consumed
 */
export const consumption = mysqlTable("consumption", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  consumptionDate: timestamp("consumptionDate").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(), // Support decimal quantities like 0.5
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Consumption = typeof consumption.$inferSelect;
export type InsertConsumption = typeof consumption.$inferInsert;

/**
 * User settings table - stores monthly budget and preferences
 */
export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  monthlyBudget: decimal("monthlyBudget", { precision: 10, scale: 2 }).notNull().default("500.00"),
  currency: varchar("currency", { length: 10 }).notNull().default("SEK"),
  startDate: timestamp("startDate"),
  dashboardLayout: text("dashboardLayout"), // JSON string for dashboard section order
  shareToken: varchar("shareToken", { length: 64 }).unique(), // For public read-only sharing
  sharePreferences: text("sharePreferences"), // JSON string for share visibility settings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

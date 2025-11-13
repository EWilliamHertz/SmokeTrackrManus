import { and, desc, eq, gte, sql, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, purchases, consumption, userSettings, InsertProduct, InsertPurchase, InsertConsumption, InsertUserSettings } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Product queries
export async function getUserProducts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(products).where(eq(products.userId, userId)).orderBy(products.name);
}

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(products).values(product);
  return result;
}

// Purchase queries
export async function getUserPurchases(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select({
      id: purchases.id,
      userId: purchases.userId,
      productId: purchases.productId,
      productName: products.name,
      purchaseDate: purchases.purchaseDate,
      quantity: purchases.quantity,
      pricePerItem: purchases.pricePerItem,
      totalCost: purchases.totalCost,
      createdAt: purchases.createdAt,
    })
    .from(purchases)
    .leftJoin(products, eq(purchases.productId, products.id))
    .where(eq(purchases.userId, userId))
    .orderBy(desc(purchases.purchaseDate));
  
  return results;
}

export async function createPurchase(purchase: InsertPurchase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(purchases).values(purchase);
}

export async function getMonthlySpending(userId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  
  const result = await db
    .select({ total: sum(purchases.totalCost) })
    .from(purchases)
    .where(
      and(
        eq(purchases.userId, userId),
        gte(purchases.purchaseDate, startDate),
        sql`${purchases.purchaseDate} < ${endDate}`
      )
    );
  
  return Number(result[0]?.total || 0);
}

// Consumption queries
export async function getUserConsumption(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(consumption).where(eq(consumption.userId, userId)).orderBy(desc(consumption.consumptionDate));
}

export async function createConsumption(cons: InsertConsumption) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(consumption).values(cons);
}

export async function getTotalConsumption(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select({ total: sum(consumption.quantity) })
    .from(consumption)
    .where(eq(consumption.userId, userId));
  
  return Number(result[0]?.total || 0);
}

export async function getConsumptionByType(userId: number, type: string) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select({ total: sum(consumption.quantity) })
    .from(consumption)
    .innerJoin(products, eq(consumption.productId, products.id))
    .where(and(eq(consumption.userId, userId), sql`${products.type} = ${type}`));
  
  return Number(result[0]?.total || 0);
}

// User settings queries
export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result[0] || null;
}

export async function upsertUserSettings(settings: InsertUserSettings) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(userSettings).values(settings).onDuplicateKeyUpdate({
    set: {
      monthlyBudget: settings.monthlyBudget,
      currency: settings.currency,
      updatedAt: new Date(),
    },
  });
}

// Inventory calculations
export async function getProductInventory(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Get total purchased
  const purchaseResult = await db
    .select({ total: sum(purchases.quantity), avgCost: sql<string>`SUM(${purchases.totalCost}) / SUM(${purchases.quantity})` })
    .from(purchases)
    .where(and(eq(purchases.userId, userId), eq(purchases.productId, productId)));
  
  const totalPurchased = Number(purchaseResult[0]?.total || 0);
  const avgCost = Number(purchaseResult[0]?.avgCost || 0);
  
  // Get total consumed
  const consumptionResult = await db
    .select({ total: sum(consumption.quantity) })
    .from(consumption)
    .where(and(eq(consumption.userId, userId), eq(consumption.productId, productId)));
  
  const totalConsumed = Number(consumptionResult[0]?.total || 0);
  
  return {
    totalPurchased,
    totalConsumed,
    currentStock: totalPurchased - totalConsumed,
    avgCost,
  };
}

import { db, sqlite } from "../db/index.js";
import { eq, desc, or, like, sql } from "drizzle-orm";
import { users, categories, products, settings } from "../shared/sqlite-schema.js";
import type { User, UserInsert, Category, CategoryInsert, Product, ProductInsert } from "../shared/sqlite-schema.js";
import bcrypt from "bcryptjs";

console.log('🚩 Checkpoint S1.0: storage.ts (MINIMAL) starting execution');

export const storage = {
  // Session / Auth methods (Minimum required to start)
  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | null> {
     const [user] = await db.select().from(users).where(
       or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail))
     ).limit(1);
     return user || null;
  },

  async getUserById(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  },

  // Branding (Used by routes.ts early on)
  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return setting ? setting.value : null;
  },

  async setSetting(key: string, value: string): Promise<void> {
    const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    if (existing.length > 0) {
      await db.update(settings).set({ value, updatedAt: new Date() }).where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({ key, value });
    }
  },

  // Dummy methods to avoid "method not found" in compiled routes
  async listCategories(): Promise<any[]> { return []; },
  async listProducts(): Promise<any[]> { return []; },
  async listCustomers(): Promise<any[]> { return []; },
  async listSuppliers(): Promise<any[]> { return []; },
  async listSales(): Promise<any[]> { return []; },
  async listPurchases(): Promise<any[]> { return []; },
  async getDashboardStats(): Promise<any> { return {}; },
  async getLatestRecentCashRegisters(): Promise<any[]> { return []; }
};

console.log('🚩 Checkpoint S1.2: storage object (MINIMAL) successfully defined!');

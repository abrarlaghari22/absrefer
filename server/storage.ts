import { users, deposits, withdrawals, transactions, settings, type User, type InsertUser, type Deposit, type InsertDeposit, type Withdrawal, type InsertWithdrawal, type Transaction, type InsertTransaction, type Setting } from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sum, and } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, amount: string): Promise<void>;
  toggleUserStatus(userId: string, isActive: boolean): Promise<void>;
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  getUserStats(): Promise<{ totalUsers: number; activeUsers: number }>;

  // Deposit methods
  createDeposit(deposit: InsertDeposit & { proofPath?: string }): Promise<Deposit>;
  getDepositById(id: string): Promise<Deposit | undefined>;
  getPendingDeposits(): Promise<(Deposit & { user: User })[]>;
  approveDeposit(id: string, adminNotes?: string): Promise<void>;
  rejectDeposit(id: string, adminNotes: string): Promise<void>;
  getUserDeposits(userId: string): Promise<Deposit[]>;

  // Withdrawal methods
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getWithdrawalById(id: string): Promise<Withdrawal | undefined>;
  getPendingWithdrawals(): Promise<(Withdrawal & { user: User })[]>;
  approveWithdrawal(id: string, adminNotes?: string): Promise<void>;
  rejectWithdrawal(id: string, adminNotes: string): Promise<void>;
  getUserWithdrawals(userId: string): Promise<Withdrawal[]>;

  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  getTransactionStats(): Promise<{ totalDeposits: string; totalWithdrawals: string; totalCommissions: string }>;

  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string): Promise<void>;
  initializeSettings(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const referralCode = `REF${randomUUID().substring(0, 8).toUpperCase()}`;
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
        referralCode,
      })
      .returning();
    
    return user;
  }

  async updateUserBalance(userId: string, amount: string): Promise<void> {
    await db
      .update(users)
      .set({ balance: amount })
      .where(eq(users.id, userId));
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isActive })
      .where(eq(users.id, userId));
  }

  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, "user"))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));
  }

  async getUserStats(): Promise<{ totalUsers: number; activeUsers: number }> {
    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "user"));
    
    const [activeResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.role, "user"), eq(users.isActive, true)));

    return {
      totalUsers: totalResult.count,
      activeUsers: activeResult.count,
    };
  }

  // Deposit methods
  async createDeposit(deposit: InsertDeposit & { proofPath?: string }): Promise<Deposit> {
    const [newDeposit] = await db
      .insert(deposits)
      .values(deposit)
      .returning();
    
    return newDeposit;
  }

  async getDepositById(id: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.id, id));
    return deposit || undefined;
  }

  async getPendingDeposits(): Promise<any[]> {
    return await db
      .select()
      .from(deposits)
      .innerJoin(users, eq(deposits.userId, users.id))
      .where(eq(deposits.status, "pending"))
      .orderBy(desc(deposits.createdAt));
  }

  async approveDeposit(id: string, adminNotes?: string): Promise<void> {
    const deposit = await this.getDepositById(id);
    if (!deposit) throw new Error("Deposit not found");

    await db.transaction(async (tx) => {
      // Update deposit status
      await tx
        .update(deposits)
        .set({
          status: "approved",
          adminNotes,
          processedAt: new Date(),
        })
        .where(eq(deposits.id, id));

      // Get current user balance
      const [user] = await tx.select().from(users).where(eq(users.id, deposit.userId));
      if (!user) throw new Error("User not found");

      const newBalance = (parseFloat(user.balance) + parseFloat(deposit.amount)).toString();
      
      // Update user balance
      await tx
        .update(users)
        .set({ balance: newBalance })
        .where(eq(users.id, deposit.userId));

      // Create transaction record
      await tx.insert(transactions).values({
        userId: deposit.userId,
        type: "deposit",
        amount: deposit.amount,
        description: `Deposit approved - Transaction ID: ${deposit.transactionId}`,
        referenceId: deposit.id,
      });

      // Handle referral commission if user was referred
      if (user.referredBy) {
        const referrer = await this.getUserByReferralCode(user.referredBy);
        if (referrer) {
          const commissionSetting = await this.getSetting("commission_rate");
          const commissionRate = commissionSetting ? parseFloat(commissionSetting.value) : 15;
          const commissionAmount = (parseFloat(deposit.amount) * commissionRate / 100).toString();
          
          const referrerNewBalance = (parseFloat(referrer.balance) + parseFloat(commissionAmount)).toString();
          
          // Update referrer balance
          await tx
            .update(users)
            .set({ balance: referrerNewBalance })
            .where(eq(users.id, referrer.id));

          // Create commission transaction
          await tx.insert(transactions).values({
            userId: referrer.id,
            type: "commission",
            amount: commissionAmount,
            description: `Referral commission from ${user.fullName}`,
            referenceId: deposit.id,
          });
        }
      }
    });
  }

  async rejectDeposit(id: string, adminNotes: string): Promise<void> {
    await db
      .update(deposits)
      .set({
        status: "rejected",
        adminNotes,
        processedAt: new Date(),
      })
      .where(eq(deposits.id, id));
  }

  async getUserDeposits(userId: string): Promise<Deposit[]> {
    return await db
      .select()
      .from(deposits)
      .where(eq(deposits.userId, userId))
      .orderBy(desc(deposits.createdAt));
  }

  // Withdrawal methods
  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const [user] = await db.select().from(users).where(eq(users.id, withdrawal.userId));
    if (!user) throw new Error("User not found");

    const availableBalance = parseFloat(user.balance);
    const withdrawalAmount = parseFloat(withdrawal.amount);

    if (withdrawalAmount > availableBalance) {
      throw new Error("Insufficient balance");
    }

    return await db.transaction(async (tx) => {
      // Create withdrawal request
      const [newWithdrawal] = await tx
        .insert(withdrawals)
        .values(withdrawal)
        .returning();

      // Deduct amount from user balance (hold it until approval)
      const newBalance = (availableBalance - withdrawalAmount).toString();
      await tx
        .update(users)
        .set({ balance: newBalance })
        .where(eq(users.id, withdrawal.userId));

      return newWithdrawal;
    });
  }

  async getWithdrawalById(id: string): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.select().from(withdrawals).where(eq(withdrawals.id, id));
    return withdrawal || undefined;
  }

  async getPendingWithdrawals(): Promise<any[]> {
    return await db
      .select()
      .from(withdrawals)
      .innerJoin(users, eq(withdrawals.userId, users.id))
      .where(eq(withdrawals.status, "pending"))
      .orderBy(desc(withdrawals.createdAt));
  }

  async approveWithdrawal(id: string, adminNotes?: string): Promise<void> {
    const withdrawal = await this.getWithdrawalById(id);
    if (!withdrawal) throw new Error("Withdrawal not found");

    await db.transaction(async (tx) => {
      // Update withdrawal status
      await tx
        .update(withdrawals)
        .set({
          status: "approved",
          adminNotes,
          processedAt: new Date(),
        })
        .where(eq(withdrawals.id, id));

      // Create transaction record
      await tx.insert(transactions).values({
        userId: withdrawal.userId,
        type: "withdrawal",
        amount: withdrawal.amount,
        description: `Withdrawal approved to ${withdrawal.method} - ${withdrawal.accountNumber}`,
        referenceId: withdrawal.id,
      });
    });
  }

  async rejectWithdrawal(id: string, adminNotes: string): Promise<void> {
    const withdrawal = await this.getWithdrawalById(id);
    if (!withdrawal) throw new Error("Withdrawal not found");

    await db.transaction(async (tx) => {
      // Update withdrawal status
      await tx
        .update(withdrawals)
        .set({
          status: "rejected",
          adminNotes,
          processedAt: new Date(),
        })
        .where(eq(withdrawals.id, id));

      // Refund amount to user balance
      const [user] = await tx.select().from(users).where(eq(users.id, withdrawal.userId));
      if (user) {
        const newBalance = (parseFloat(user.balance) + parseFloat(withdrawal.amount)).toString();
        await tx
          .update(users)
          .set({ balance: newBalance })
          .where(eq(users.id, withdrawal.userId));
      }
    });
  }

  async getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
    return await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.userId, userId))
      .orderBy(desc(withdrawals.createdAt));
  }

  // Transaction methods
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    
    return newTransaction;
  }

  async getUserTransactions(userId: string, limit = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getTransactionStats(): Promise<{ totalDeposits: string; totalWithdrawals: string; totalCommissions: string }> {
    const [depositsSum] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(eq(transactions.type, "deposit"));

    const [withdrawalsSum] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(eq(transactions.type, "withdrawal"));

    const [commissionsSum] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(eq(transactions.type, "commission"));

    return {
      totalDeposits: depositsSum.total || "0",
      totalWithdrawals: withdrawalsSum.total || "0",
      totalCommissions: commissionsSum.total || "0",
    };
  }

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async updateSetting(key: string, value: string): Promise<void> {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() },
      });
  }

  async initializeSettings(): Promise<void> {
    const defaultSettings = [
      { key: "commission_rate", value: "15" },
      { key: "min_withdrawal", value: "100" },
      { key: "deposit_amount", value: "1000" },
    ];

    for (const setting of defaultSettings) {
      const existing = await this.getSetting(setting.key);
      if (!existing) {
        await this.updateSetting(setting.key, setting.value);
      }
    }
  }
}

export const storage = new DatabaseStorage();

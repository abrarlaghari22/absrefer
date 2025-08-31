import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "./storage";
import { generateToken, authenticateToken, authenticateAdmin, type AuthRequest } from "./middleware/auth";
import { upload } from "./middleware/upload";
import { sendEmail, getDepositApprovalEmail, getWithdrawalApprovalEmail, getReferralCommissionEmail } from "./services/email";
import { insertUserSchema, insertDepositSchema, insertWithdrawalSchema, users } from "@shared/schema";
import { db } from "./db";
import path from "path";

async function createDefaultAdmin() {
  try {
    const adminEmail = "admin@absreferzone.com";
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      
      // Insert admin user directly into database
      const [adminUser] = await db
        .insert(users)
        .values({
          fullName: "ABS REFERZONE Admin",
          email: adminEmail,
          password: hashedPassword,
          phone: "03000000000",
          role: "admin",
          referralCode: "ADMIN001",
        })
        .returning();
      
      console.log(`✓ Default admin user created: ${adminEmail} / admin123`);
    }
  } catch (error) {
    console.error("Failed to create default admin user:", error);
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize settings
  await storage.initializeSettings();
  
  // Create default admin user if it doesn't exist
  await createDefaultAdmin();

  // Serve uploaded files
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Validate referral code if provided
      if (validatedData.referredBy && validatedData.referredBy.trim()) {
        const referrer = await storage.getUserByReferralCode(validatedData.referredBy);
        if (!referrer) {
          return res.status(400).json({ message: "Invalid referral code" });
        }
      }

      const user = await storage.createUser(validatedData);
      const token = generateToken({ id: user.id, email: user.email, role: user.role });

      res.json({
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          balance: user.balance,
          referralCode: user.referralCode,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "Account is deactivated" });
      }

      const token = generateToken({ id: user.id, email: user.email, role: user.role });

      res.json({
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          balance: user.balance,
          referralCode: user.referralCode,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User routes
  app.get("/api/user/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        balance: user.balance,
        referralCode: user.referralCode,
        phone: user.phone,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get("/api/user/transactions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.user!.id, 20);
      res.json(transactions);
    } catch (error) {
      console.error("Transactions fetch error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/user/referrals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Count referrals and calculate total earnings
      const referrals = await storage.getAllUsers();
      const userReferrals = referrals.filter(u => u.referredBy === req.user!.id);
      
      const commissionTransactions = await storage.getUserTransactions(req.user!.id, 100);
      const totalEarnings = commissionTransactions
        .filter(t => t.type === "commission")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      res.json({
        totalReferrals: userReferrals.length,
        totalEarnings: totalEarnings.toString(),
        referrals: userReferrals.map(u => ({
          fullName: u.fullName,
          email: u.email,
          createdAt: u.createdAt,
        })),
      });
    } catch (error) {
      console.error("Referrals fetch error:", error);
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  // Deposit routes
  app.post("/api/deposits", authenticateToken, upload.single("proof"), async (req: AuthRequest, res) => {
    try {
      const depositData = {
        userId: req.user!.id,
        amount: req.body.amount,
        transactionId: req.body.transactionId,
        notes: req.body.notes,
      };

      const validatedData = insertDepositSchema.parse(depositData);
      
      // Validate deposit amount
      const depositSetting = await storage.getSetting("deposit_amount");
      const requiredAmount = depositSetting ? depositSetting.value : "1000";
      
      if (validatedData.amount !== requiredAmount) {
        return res.status(400).json({ 
          message: `Deposit amount must be exactly PKR ${requiredAmount}` 
        });
      }

      const deposit = await storage.createDeposit({
        ...validatedData,
        proofPath: req.file ? req.file.filename : undefined,
      });

      res.json(deposit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Deposit creation error:", error);
      res.status(500).json({ message: "Failed to create deposit" });
    }
  });

  app.get("/api/deposits", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const deposits = await storage.getUserDeposits(req.user!.id);
      res.json(deposits);
    } catch (error) {
      console.error("Deposits fetch error:", error);
      res.status(500).json({ message: "Failed to fetch deposits" });
    }
  });

  // Withdrawal routes
  app.post("/api/withdrawals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const withdrawalData = {
        userId: req.user!.id,
        amount: req.body.amount,
        method: req.body.method,
        accountNumber: req.body.accountNumber,
        accountName: req.body.accountName,
      };

      const validatedData = insertWithdrawalSchema.parse(withdrawalData);
      
      // Validate minimum withdrawal
      const minWithdrawalSetting = await storage.getSetting("min_withdrawal");
      const minAmount = minWithdrawalSetting ? parseFloat(minWithdrawalSetting.value) : 100;
      
      if (parseFloat(validatedData.amount) < minAmount) {
        return res.status(400).json({ 
          message: `Minimum withdrawal amount is PKR ${minAmount}` 
        });
      }

      const withdrawal = await storage.createWithdrawal(validatedData);
      res.json(withdrawal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Withdrawal creation error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create withdrawal" });
    }
  });

  app.get("/api/withdrawals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const withdrawals = await storage.getUserWithdrawals(req.user!.id);
      res.json(withdrawals);
    } catch (error) {
      console.error("Withdrawals fetch error:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", authenticateAdmin, async (req: AuthRequest, res) => {
    try {
      const userStats = await storage.getUserStats();
      const transactionStats = await storage.getTransactionStats();
      const commissionSetting = await storage.getSetting("commission_rate");

      res.json({
        ...userStats,
        ...transactionStats,
        commissionRate: commissionSetting?.value || "15",
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/pending-deposits", authenticateAdmin, async (req: AuthRequest, res) => {
    try {
      const deposits = await storage.getPendingDeposits();
      res.json(deposits);
    } catch (error) {
      console.error("Pending deposits fetch error:", error);
      res.status(500).json({ message: "Failed to fetch pending deposits" });
    }
  });

  app.post("/api/admin/deposits/:id/approve", authenticateAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;

      const deposit = await storage.getDepositById(id);
      if (!deposit) {
        return res.status(404).json({ message: "Deposit not found" });
      }

      const user = await storage.getUser(deposit.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.approveDeposit(id, adminNotes);

      // Send approval email
      await sendEmail({
        to: user.email,
        subject: "Deposit Approved - ABS REFERZONE",
        html: getDepositApprovalEmail(user.fullName, deposit.amount),
      });

      // Send referral commission email if applicable
      if (user.referredBy) {
        const referrer = await storage.getUserByReferralCode(user.referredBy);
        if (referrer) {
          const commissionSetting = await storage.getSetting("commission_rate");
          const commissionRate = commissionSetting ? parseFloat(commissionSetting.value) : 15;
          const commissionAmount = (parseFloat(deposit.amount) * commissionRate / 100).toString();
          
          await sendEmail({
            to: referrer.email,
            subject: "Referral Commission Earned - ABS REFERZONE",
            html: getReferralCommissionEmail(referrer.fullName, commissionAmount, user.fullName),
          });
        }
      }

      res.json({ message: "Deposit approved successfully" });
    } catch (error) {
      console.error("Deposit approval error:", error);
      res.status(500).json({ message: "Failed to approve deposit" });
    }
  });

  app.post("/api/admin/deposits/:id/reject", authenticateAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;

      if (!adminNotes) {
        return res.status(400).json({ message: "Admin notes required for rejection" });
      }

      await storage.rejectDeposit(id, adminNotes);
      res.json({ message: "Deposit rejected successfully" });
    } catch (error) {
      console.error("Deposit rejection error:", error);
      res.status(500).json({ message: "Failed to reject deposit" });
    }
  });

  app.get("/api/admin/pending-withdrawals", authenticateAdmin, async (req: AuthRequest, res) => {
    try {
      const withdrawals = await storage.getPendingWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      console.error("Pending withdrawals fetch error:", error);
      res.status(500).json({ message: "Failed to fetch pending withdrawals" });
    }
  });

  app.post("/api/admin/withdrawals/:id/approve", authenticateAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;

      const withdrawal = await storage.getWithdrawalById(id);
      if (!withdrawal) {
        return res.status(404).json({ message: "Withdrawal not found" });
      }

      const user = await storage.getUser(withdrawal.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.approveWithdrawal(id, adminNotes);

      // Send approval email
      await sendEmail({
        to: user.email,
        subject: "Withdrawal Processed - ABS REFERZONE",
        html: getWithdrawalApprovalEmail(user.fullName, withdrawal.amount, withdrawal.method),
      });

      res.json({ message: "Withdrawal approved successfully" });
    } catch (error) {
      console.error("Withdrawal approval error:", error);
      res.status(500).json({ message: "Failed to approve withdrawal" });
    }
  });

  app.post("/api/admin/withdrawals/:id/reject", authenticateAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;

      if (!adminNotes) {
        return res.status(400).json({ message: "Admin notes required for rejection" });
      }

      await storage.rejectWithdrawal(id, adminNotes);
      res.json({ message: "Withdrawal rejected successfully" });
    } catch (error) {
      console.error("Withdrawal rejection error:", error);
      res.status(500).json({ message: "Failed to reject withdrawal" });
    }
  });

  app.get("/api/admin/users", authenticateAdmin, async (req: AuthRequest, res) => {
    try {
      const { page = "1", limit = "50" } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const users = await storage.getAllUsers(limitNum, offset);
      res.json(users);
    } catch (error) {
      console.error("Users fetch error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/:id/toggle-status", authenticateAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      await storage.toggleUserStatus(id, isActive);
      res.json({ message: `User ${isActive ? "activated" : "deactivated"} successfully` });
    } catch (error) {
      console.error("User status toggle error:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.get("/api/admin/settings", authenticateAdmin, async (req: AuthRequest, res) => {
    try {
      const commissionRate = await storage.getSetting("commission_rate");
      const minWithdrawal = await storage.getSetting("min_withdrawal");
      const depositAmount = await storage.getSetting("deposit_amount");

      res.json({
        commissionRate: commissionRate?.value || "15",
        minWithdrawal: minWithdrawal?.value || "100",
        depositAmount: depositAmount?.value || "1000",
      });
    } catch (error) {
      console.error("Settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings", authenticateAdmin, async (req: AuthRequest, res) => {
    try {
      const { commissionRate, minWithdrawal, depositAmount } = req.body;

      if (commissionRate !== undefined) {
        await storage.updateSetting("commission_rate", commissionRate);
      }
      if (minWithdrawal !== undefined) {
        await storage.updateSetting("min_withdrawal", minWithdrawal);
      }
      if (depositAmount !== undefined) {
        await storage.updateSetting("deposit_amount", depositAmount);
      }

      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Settings update error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

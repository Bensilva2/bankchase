import { getDatabase } from './client';
import { ObjectId } from 'mongodb';

/**
 * MongoDB Collections for BankChase
 * 
 * Hybrid approach:
 * - PostgreSQL/Supabase: RBAC, auth, user profiles, accounts, audit logs
 * - MongoDB: Flexible documents, transactions, notifications, preferences, analytics
 */

export interface UserNotification {
  _id?: ObjectId;
  userId: string; // UUID from Supabase users table
  type: 'transaction' | 'security' | 'reward' | 'alert' | 'system';
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // TTL for auto-deletion
}

export interface UserPreference {
  _id?: ObjectId;
  userId: string; // UUID from Supabase users table
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    frequency: 'realtime' | 'daily' | 'weekly';
  };
  twoFAMethod: 'sms' | 'email' | 'authenticator' | null;
  lastLogin: Date;
  loginHistory: Array<{
    timestamp: Date;
    ip: string;
    device: string;
    status: 'success' | 'failed';
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  _id?: ObjectId;
  userId: string; // UUID from Supabase users table
  accountId: string; // UUID from Supabase accounts table
  type: 'debit' | 'credit' | 'transfer' | 'withdrawal' | 'deposit';
  amount: number;
  currency: string;
  description: string;
  recipient?: {
    accountNumber: string;
    accountHolder: string;
    bankName: string;
  };
  metadata?: Record<string, any>;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
}

export interface TransactionAnalytics {
  _id?: ObjectId;
  userId: string;
  month: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  categoryBreakdown: {
    [category: string]: number;
  };
  merchantCount: number;
  averageTransactionAmount: number;
  largestTransaction: number;
  transactionCount: number;
  updatedAt: Date;
}

export interface Device {
  _id?: ObjectId;
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  osType: string;
  osVersion: string;
  browserType: string;
  browserVersion: string;
  ipAddress: string;
  userAgent: string;
  lastActive: Date;
  isActive: boolean;
  isTrusted: boolean;
  createdAt: Date;
}

export interface AuditLog {
  _id?: ObjectId;
  userId: string;
  actionType: string;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  createdAt: Date;
}

/**
 * Initialize MongoDB collections with indexes
 */
export async function initializeCollections() {
  const db = await getDatabase();

  // Notifications collection with TTL
  await db.collection('notifications').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('notifications').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection('notifications').createIndex({ read: 1 });

  // Preferences collection
  await db.collection('preferences').createIndex({ userId: 1 }, { unique: true });

  // Transactions collection
  await db.collection('transactions').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('transactions').createIndex({ accountId: 1, status: 1 });
  await db.collection('transactions').createIndex({ type: 1 });

  // Analytics collection
  await db.collection('analytics').createIndex({ userId: 1, month: 1 }, { unique: true });

  // Devices collection
  await db.collection('devices').createIndex({ userId: 1 });
  await db.collection('devices').createIndex({ deviceId: 1 });
  await db.collection('devices').createIndex({ lastActive: 1 });

  // Audit logs collection
  await db.collection('auditLogs').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('auditLogs').createIndex({ resourceType: 1, resourceId: 1 });
  await db.collection('auditLogs').createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

  console.log('[v0] MongoDB collections initialized with indexes');
}

/**
 * Collection getters
 */
export async function getNotificationsCollection() {
  const db = await getDatabase();
  return db.collection<UserNotification>('notifications');
}

export async function getPreferencesCollection() {
  const db = await getDatabase();
  return db.collection<UserPreference>('preferences');
}

export async function getTransactionsCollection() {
  const db = await getDatabase();
  return db.collection<Transaction>('transactions');
}

export async function getAnalyticsCollection() {
  const db = await getDatabase();
  return db.collection<TransactionAnalytics>('analytics');
}

export async function getDevicesCollection() {
  const db = await getDatabase();
  return db.collection<Device>('devices');
}

export async function getAuditLogsCollection() {
  const db = await getDatabase();
  return db.collection<AuditLog>('auditLogs');
}

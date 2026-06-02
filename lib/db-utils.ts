import { getSql } from './db';

/**
 * Database utility functions for common operations
 */

export interface Comment {
  id: number;
  comment: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  user_id: string;
  amount: number;
  description: string | null;
  type: string | null;
  status: string;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
}

/**
 * Comment operations
 */
export async function getComments(limit = 50): Promise<Comment[]> {
  try {
    const sql = getSql();
    const comments = await sql`
      SELECT id, comment, created_at 
      FROM comments 
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `;
    return comments as Comment[];
  } catch (error) {
    console.error('[v0] Error fetching comments:', error);
    throw error;
  }
}

export async function addComment(comment: string): Promise<Comment> {
  try {
    if (!comment || comment.trim().length === 0) {
      throw new Error('Comment cannot be empty');
    }

    const sql = getSql();
    const result = await sql`
      INSERT INTO comments (comment) 
      VALUES (${comment}) 
      RETURNING id, comment, created_at
    `;
    return result[0] as Comment;
  } catch (error) {
    console.error('[v0] Error adding comment:', error);
    throw error;
  }
}

/**
 * Transaction operations
 */
export async function getTransactions(userId: string): Promise<Transaction[]> {
  try {
    const sql = getSql();
    const transactions = await sql`
      SELECT id, user_id, amount, description, type, status, created_at 
      FROM transactions 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC 
      LIMIT 100
    `;
    return transactions as Transaction[];
  } catch (error) {
    console.error('[v0] Error fetching transactions:', error);
    throw error;
  }
}

export async function addTransaction(
  userId: string,
  amount: number,
  description: string,
  type: string
): Promise<Transaction> {
  try {
    if (!userId || amount <= 0) {
      throw new Error('Invalid transaction data');
    }

    const sql = getSql();
    const result = await sql`
      INSERT INTO transactions (user_id, amount, description, type) 
      VALUES (${userId}, ${amount}, ${description}, ${type}) 
      RETURNING id, user_id, amount, description, type, status, created_at
    `;
    return result[0] as Transaction;
  } catch (error) {
    console.error('[v0] Error adding transaction:', error);
    throw error;
  }
}

/**
 * User operations
 */
export async function getUser(email: string): Promise<User | null> {
  try {
    const sql = getSql();
    const result = await sql`
      SELECT id, email, name, created_at 
      FROM users 
      WHERE email = ${email}
    `;
    return (result[0] as User) || null;
  } catch (error) {
    console.error('[v0] Error fetching user:', error);
    throw error;
  }
}

export async function createUser(
  email: string,
  name: string
): Promise<User> {
  try {
    if (!email || !name) {
      throw new Error('Email and name are required');
    }

    const sql = getSql();
    const result = await sql`
      INSERT INTO users (email, name) 
      VALUES (${email}, ${name}) 
      RETURNING id, email, name, created_at
    `;
    return result[0] as User;
  } catch (error) {
    console.error('[v0] Error creating user:', error);
    throw error;
  }
}

/**
 * Utility functions
 */
export async function ensureTablesExist(): Promise<void> {
  try {
    const sql = getSql();

    // Comments table
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Transactions table
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('[v0] All tables ensured to exist');
  } catch (error) {
    console.error('[v0] Error ensuring tables exist:', error);
    throw error;
  }
}

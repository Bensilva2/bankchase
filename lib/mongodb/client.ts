import { MongoClient, MongoClientOptions } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

// MongoDB is optional - only required at runtime if MongoDB features are used
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri && process.env.NODE_ENV === 'production') {
  throw new Error('MONGODB_URI environment variable is required in production');
}

const options: MongoClientOptions = {
  appName: 'bankchase.app',
  maxIdleTimeMS: 5000,
  // Connection pooling for Vercel Functions
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Create MongoDB client (only if URI is provided)
const client = mongoUri ? new MongoClient(mongoUri, options) : null;

// Attach to Vercel's database pool for proper cleanup on function suspension
if (client) {
  attachDatabasePool(client);
}

// Lazy initialization flag
let mongoConnected = false;

/**
 * Get or create MongoDB connection
 * Ensures single connection instance across all functions
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    throw new Error('MongoDB not configured. Set MONGODB_URI environment variable.');
  }
  
  if (!mongoConnected) {
    try {
      await client.connect();
      mongoConnected = true;
      console.log('[v0] MongoDB connected successfully');
    } catch (error) {
      console.error('[v0] MongoDB connection error:', error);
      throw error;
    }
  }
  return client;
}

/**
 * Get MongoDB database instance
 */
export async function getDatabase(dbName: string = 'bankchase') {
  const mongoClient = await getMongoClient();
  return mongoClient.db(dbName);
}

/**
 * Health check for MongoDB connection
 */
export async function checkMongoHealth(): Promise<boolean> {
  try {
    const mongoClient = await getMongoClient();
    await mongoClient.db('admin').command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('[v0] MongoDB health check failed:', error);
    return false;
  }
}

export default client;

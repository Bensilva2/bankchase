import { MongoClient, MongoClientOptions } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
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

// Create MongoDB client
const client = new MongoClient(process.env.MONGODB_URI, options);

// Attach to Vercel's database pool for proper cleanup on function suspension
attachDatabasePool(client);

// Lazy initialization flag
let mongoConnected = false;

/**
 * Get or create MongoDB connection
 * Ensures single connection instance across all functions
 */
export async function getMongoClient(): Promise<MongoClient> {
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

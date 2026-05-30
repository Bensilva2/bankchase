import {
  getNotificationsCollection,
  getPreferencesCollection,
  getTransactionsCollection,
  getAnalyticsCollection,
  getDevicesCollection,
  getAuditLogsCollection,
  UserNotification,
  UserPreference,
  Transaction,
  Device,
  AuditLog,
} from './collections';
import { ObjectId } from 'mongodb';

/**
 * NOTIFICATION OPERATIONS
 */

export async function createNotification(
  userId: string,
  notification: Omit<UserNotification, '_id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const collection = await getNotificationsCollection();
  const now = new Date();

  const result = await collection.insertOne({
    ...notification,
    createdAt: now,
    updatedAt: now,
  } as UserNotification);

  return result.insertedId.toString();
}

export async function getUserNotifications(userId: string, limit: number = 50): Promise<UserNotification[]> {
  const collection = await getNotificationsCollection();
  return collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
  const collection = await getNotificationsCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(notificationId), userId },
    { $set: { read: true, updatedAt: new Date() } }
  );

  return result.modifiedCount > 0;
}

export async function deleteNotification(notificationId: string, userId: string): Promise<boolean> {
  const collection = await getNotificationsCollection();
  const result = await collection.deleteOne({
    _id: new ObjectId(notificationId),
    userId,
  });

  return result.deletedCount > 0;
}

/**
 * PREFERENCE OPERATIONS
 */

export async function getUserPreferences(userId: string): Promise<UserPreference | null> {
  const collection = await getPreferencesCollection();
  return collection.findOne({ userId });
}

export async function createOrUpdatePreferences(userId: string, preferences: Partial<UserPreference>): Promise<void> {
  const collection = await getPreferencesCollection();

  await collection.updateOne(
    { userId },
    {
      $set: {
        ...preferences,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

export async function updateNotificationSettings(
  userId: string,
  settings: Partial<UserPreference['notifications']>
): Promise<void> {
  const collection = await getPreferencesCollection();

  await collection.updateOne(
    { userId },
    {
      $set: {
        'notifications': settings,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

/**
 * TRANSACTION OPERATIONS
 */

export async function recordTransaction(
  userId: string,
  transaction: Omit<Transaction, '_id' | 'createdAt'>
): Promise<string> {
  const collection = await getTransactionsCollection();

  const result = await collection.insertOne({
    ...transaction,
    createdAt: new Date(),
  } as Transaction);

  return result.insertedId.toString();
}

export async function getUserTransactions(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  const collection = await getTransactionsCollection();
  return collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .toArray();
}

export async function getTransactionsByStatus(userId: string, status: string): Promise<Transaction[]> {
  const collection = await getTransactionsCollection();
  return collection
    .find({ userId, status })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function updateTransactionStatus(
  transactionId: string,
  userId: string,
  status: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  const collection = await getTransactionsCollection();
  const updates: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === 'completed') {
    updates.completedAt = new Date();
  }

  if (metadata) {
    updates.metadata = metadata;
  }

  const result = await collection.updateOne(
    { _id: new ObjectId(transactionId), userId },
    { $set: updates }
  );

  return result.modifiedCount > 0;
}

/**
 * DEVICE OPERATIONS
 */

export async function registerDevice(userId: string, device: Omit<Device, '_id' | 'createdAt'>): Promise<string> {
  const collection = await getDevicesCollection();

  const result = await collection.insertOne({
    ...device,
    createdAt: new Date(),
  } as Device);

  return result.insertedId.toString();
}

export async function getUserDevices(userId: string): Promise<Device[]> {
  const collection = await getDevicesCollection();
  return collection.find({ userId }).toArray();
}

export async function updateDeviceLastActive(deviceId: string, userId: string): Promise<boolean> {
  const collection = await getDevicesCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(deviceId), userId },
    { $set: { lastActive: new Date() } }
  );

  return result.modifiedCount > 0;
}

export async function removeDevice(deviceId: string, userId: string): Promise<boolean> {
  const collection = await getDevicesCollection();
  const result = await collection.deleteOne({
    _id: new ObjectId(deviceId),
    userId,
  });

  return result.deletedCount > 0;
}

/**
 * AUDIT LOG OPERATIONS
 */

export async function recordAuditLog(
  userId: string,
  auditLog: Omit<AuditLog, '_id' | 'createdAt'>
): Promise<string> {
  const collection = await getAuditLogsCollection();

  const result = await collection.insertOne({
    ...auditLog,
    createdAt: new Date(),
  } as AuditLog);

  return result.insertedId.toString();
}

export async function getUserAuditLogs(userId: string, limit: number = 100): Promise<AuditLog[]> {
  const collection = await getAuditLogsCollection();
  return collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function getResourceAuditLogs(resourceType: string, resourceId: string): Promise<AuditLog[]> {
  const collection = await getAuditLogsCollection();
  return collection
    .find({ resourceType, resourceId })
    .sort({ createdAt: -1 })
    .toArray();
}

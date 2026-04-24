/**
 * Monday.com Integration Service
 * Handles all Monday.com API interactions for user onboarding and tracking
 */

interface MondayItemData {
  userId: string;
  email: string;
  itemId: string;
  status: string;
  createdAt: string;
}

// In-memory store for Monday item IDs (in production, use a database)
let mondayItemsMap: Map<string, MondayItemData> = new Map();

/**
 * Store Monday item ID for a user
 * In production, this should be saved to a database (Supabase, Neon, etc.)
 */
export function storeMondayItemId(
  userId: string,
  email: string,
  itemId: string
): void {
  mondayItemsMap.set(userId, {
    userId,
    email,
    itemId,
    status: "Signed Up",
    createdAt: new Date().toISOString(),
  });

  // Also store in localStorage for client-side access
  try {
    const items = JSON.parse(
      typeof window !== "undefined"
        ? localStorage.getItem("monday_items") || "{}"
        : "{}"
    );
    items[userId] = { itemId, email };
    if (typeof window !== "undefined") {
      localStorage.setItem("monday_items", JSON.stringify(items));
    }
  } catch (error) {
    console.error("[v0] Failed to store Monday item in localStorage:", error);
  }
}

/**
 * Retrieve Monday item ID for a user
 */
export function getMondayItemId(userId: string): string | null {
  const item = mondayItemsMap.get(userId);
  if (item) {
    return item.itemId;
  }

  // Try to get from localStorage
  try {
    if (typeof window !== "undefined") {
      const items = JSON.parse(localStorage.getItem("monday_items") || "{}");
      return items[userId]?.itemId || null;
    }
  } catch (error) {
    console.error("[v0] Failed to retrieve Monday item from localStorage:", error);
  }

  return null;
}

/**
 * Update user status in Monday
 */
export async function updateMondayStatus(
  itemId: string,
  newStatus: "Signed Up" | "Profile Complete" | "Bank Connected" | "First Deposit" | "Active User"
): Promise<boolean> {
  try {
    const statusIndex = {
      "Signed Up": 0,
      "Profile Complete": 1,
      "Bank Connected": 2,
      "First Deposit": 3,
      "Active User": 4,
    };

    const response = await fetch("/api/monday/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId,
        status: newStatus,
        statusIndex: statusIndex[newStatus],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("[v0] Failed to update Monday status:", error);
    return false;
  }
}

/**
 * Update balance in Monday
 */
export async function updateMondayBalance(
  userId: string,
  balance: number
): Promise<boolean> {
  const itemId = getMondayItemId(userId);
  if (!itemId) {
    console.warn(`[v0] No Monday item ID found for user ${userId}`);
    return false;
  }

  try {
    const response = await fetch("/api/monday/update-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, balance, itemId }),
    });

    return response.ok;
  } catch (error) {
    console.error("[v0] Failed to update Monday balance:", error);
    return false;
  }
}

/**
 * Update bank connection in Monday
 */
export async function updateMondayBank(
  userId: string,
  bankName: string,
  accountLast4?: string
): Promise<boolean> {
  const itemId = getMondayItemId(userId);
  if (!itemId) {
    console.warn(`[v0] No Monday item ID found for user ${userId}`);
    return false;
  }

  try {
    const response = await fetch("/api/monday/update-bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, bankName, accountLast4, itemId }),
    });

    return response.ok;
  } catch (error) {
    console.error("[v0] Failed to update Monday bank:", error);
    return false;
  }
}

/**
 * Get all stored Monday items (for debugging)
 */
export function getAllMondayItems(): MondayItemData[] {
  return Array.from(mondayItemsMap.values());
}

/**
 * Clear Monday items (for testing)
 */
export function clearMondayItems(): void {
  mondayItemsMap.clear();
  if (typeof window !== "undefined") {
    localStorage.removeItem("monday_items");
  }
}

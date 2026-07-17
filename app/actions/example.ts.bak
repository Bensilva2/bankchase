'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
// Replace `items` with your table from lib/db/schema.ts.
// import { items } from "@/lib/db/schema"
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

/**
 * Resolve the current user id from the Better Auth session.
 * Every server action that touches user data MUST go through this helper
 * — it is the only thing standing between one user and another's rows.
 */
async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// Template — replace `items` and the field names with your own table.
//
// export async function getItems() {
//   const userId = await getUserId()
//   return db
//     .select()
//     .from(items)
//     .where(eq(items.userId, userId))
//     .orderBy(desc(items.createdAt))
// }
//
// export async function createItem(title: string) {
//   const userId = await getUserId()
//   const trimmed = title.trim()
//   if (!trimmed) return
//   await db.insert(items).values({ userId, title: trimmed })
//   revalidatePath("/")
// }
//
// export async function updateItem(id: number, fields: { completed?: boolean }) {
//   const userId = await getUserId()
//   await db
//     .update(items)
//     .set(fields)
//     .where(and(eq(items.id, id), eq(items.userId, userId)))
//   revalidatePath("/")
// }
//
// export async function deleteItem(id: number) {
//   const userId = await getUserId()
//   await db
//     .delete(items)
//     .where(and(eq(items.id, id), eq(items.userId, userId)))
//   revalidatePath("/")
// }

export {}

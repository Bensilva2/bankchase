# Prisma + Neon + Better Auth Setup Guide

## Overview
This project is now fully configured with:
- **Neon PostgreSQL** - Database integration
- **Drizzle ORM** - Type-safe database queries
- **Better Auth** - Email + password authentication
- **Next.js 16** - Full-stack framework

## What's Been Installed

### Dependencies
- `better-auth` - Authentication framework
- `pg` - PostgreSQL client
- `drizzle-orm` - ORM for database operations
- `@types/pg` - TypeScript types for PostgreSQL

## Project Structure

```
lib/
  ├── auth.ts              ← Better Auth server config (load-bearing file)
  ├── auth-client.ts       ← Better Auth React client
  └── db/
      ├── index.ts         ← Drizzle client + shared pg Pool
      └── schema.ts        ← Better Auth tables + app tables

app/
  ├── api/auth/[...all]/   ← Better Auth HTTP handler
  ├── sign-in/page.tsx     ← Sign-in route
  ├── sign-up/page.tsx     ← Sign-up route
  └── page-protected.tsx   ← Example of protected page

components/
  └── auth-form.tsx        ← Shared auth form component

app/actions/
  └── example.ts           ← Server actions template with getUserId()
```

## Database Setup

### Better Auth Tables (Auto-created)
The following tables are created in your Neon database:
- `user` - User accounts
- `session` - Session tokens
- `account` - OAuth/provider accounts
- `verification` - Email verification tokens

All tables have proper indexes for performance and referential integrity.

## Environment Variables (Already Set)

Required variables (you added these):
- `DATABASE_URL` - Neon connection string
- `DATABASE_URL_UNPOOLED` - For migrations
- `BETTER_AUTH_SECRET` - Session secret (≥32 chars)

Optional variables:
- `BETTER_AUTH_URL` - Custom domain (auto-detected if not set)

## Getting Started

### 1. Test Authentication
Visit `/sign-up` to create an account, then `/sign-in` to test login.

### 2. Create App Tables
Add custom tables to `lib/db/schema.ts`:

```typescript
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  userId: text('userId').notNull(), // Always include for scoping
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
```

### 3. Server Actions with getUserId()
Always use the `getUserId()` pattern to protect user data:

```typescript
'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function createPost(title: string, content: string) {
  const userId = await getUserId()
  const result = await db.insert(posts).values({
    title,
    content,
    userId,
  }).returning()
  revalidatePath('/')
  return result[0]
}

export async function getUserPosts() {
  const userId = await getUserId()
  return db
    .select()
    .from(posts)
    .where(eq(posts.userId, userId))
}
```

### 4. Protected Routes
Use server components to redirect unauthenticated users:

```typescript
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    redirect('/sign-in')
  }
  
  return (
    <div>
      <h1>Welcome, {session.user.name || session.user.email}</h1>
    </div>
  )
}
```

## Key Files Explained

### lib/auth.ts
The "load-bearing file" that configures Better Auth:
- Sets up database connection via `pg` Pool
- Configures email + password authentication
- Handles baseURL detection for Vercel/v0/production
- Trusts origins for secure session cookies
- Dev-mode cookie override for v0 preview iframe

### lib/db/index.ts
Creates a single shared `pg` Pool used by:
- Better Auth (user/session management)
- Drizzle ORM (app queries)

Never create multiple connection pools.

### lib/db/schema.ts
Defines all database tables using Drizzle:
- Better Auth tables (user, session, account, verification)
- Your app tables
- Column names are camelCase to match Better Auth defaults

### components/auth-form.tsx
Shared form for sign-in and sign-up:
- Client component using `authClient`
- Handles email/password submission
- Redirects on success

### app/api/auth/[...all]/route.ts
Mounts Better Auth's HTTP handler:
- Catch-all parameter **must** be `[...all]`
- Handles `/api/auth/sign-in`, `/api/auth/sign-up`, etc.

## Important Security Notes

1. **No Row-Level Security (RLS)** - Neon doesn't have RLS like Supabase
   - Every query MUST include `eq(table.userId, userId)` in the WHERE clause
   - The `getUserId()` helper enforces this pattern

2. **Session Scoping** - Never forget the userId check:
   ```typescript
   // ❌ BAD - Returns all posts
   const posts = await db.select().from(posts)
   
   // ✅ GOOD - Returns only user's posts
   const posts = await db.select().from(posts).where(eq(posts.userId, userId))
   ```

3. **BETTER_AUTH_SECRET** - Must be ≥32 characters
   - Generate with: `openssl rand -base64 32`
   - Without it, sessions will fail silently

## Troubleshooting

### "Unauthorized" error in server actions
- Check that `BETTER_AUTH_SECRET` is set
- Verify you're making the call from an authenticated route
- Ensure `getUserId()` is being called

### Session cookie not persisting in v0 preview
- This is normal due to iframe sandbox
- In production, cookies will persist properly
- The `sameSite: "none"` dev override handles this

### Type errors with Drizzle
- Ensure `lib/db/schema.ts` exports table definitions
- Import tables like: `import { posts } from '@/lib/db/schema'`

### Database connection errors
- Verify `DATABASE_URL` is correctly set
- Check Neon dashboard for active connections
- Try reconnecting by restarting the dev server

## Next Steps

1. Review the example files in `app/` and `app/actions/`
2. Create your app's custom tables in `lib/db/schema.ts`
3. Write server actions using the `getUserId()` pattern
4. Build protected routes by checking sessions
5. Deploy to Vercel when ready

For more details, see the inline comments in each file and the Neon/Better Auth documentation.

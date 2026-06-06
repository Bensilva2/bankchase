# Neon + Better Auth - Quick Reference

## Authentication Routes
- `GET /sign-in` - Login page
- `GET /sign-up` - Registration page
- `POST /api/auth/sign-in` - Sign in (called by form)
- `POST /api/auth/sign-up` - Sign up (called by form)

## Core Files

### lib/auth.ts
- Configures Better Auth with Neon database
- Sets up email + password authentication
- Manages session cookies and CORS

### lib/auth-client.ts
- Client-side auth client for browser
- `authClient.signIn.email({ email, password })`
- `authClient.signUp.email({ email, password, name })`
- `authClient.signOut()`

### lib/db/index.ts
- Creates shared `pg` Pool
- Exports Drizzle `db` instance
- Used by Better Auth + your queries

### lib/db/schema.ts
- Better Auth tables: user, session, account, verification
- Add your custom tables here
- Column names are camelCase (required by Better Auth)

## Common Patterns

### Check Session in Server Component
```typescript
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  
  return <div>{session.user.email}</div>
}
```

### Server Action with User Data
```typescript
'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getMyData() {
  const userId = await getUserId()
  return db.query.myTable.findMany({
    where: (t) => eq(t.userId, userId)
  })
}
```

### Client Component Using Auth
```typescript
'use client'

import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  
  const handleLogout = async () => {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }
  
  return <button onClick={handleLogout}>Logout</button>
}
```

### Query User Data
```typescript
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Get user by email
const foundUser = await db.query.user.findFirst({
  where: eq(user.email, 'user@example.com')
})

// Get user by ID
const userData = await db.query.user.findFirst({
  where: eq(user.id, userId)
})
```

## Database Operations

### Select
```typescript
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const userPosts = await db.query.posts.findMany({
  where: eq(posts.userId, userId)
})
```

### Insert
```typescript
const newPost = await db.insert(posts).values({
  title: 'Hello',
  content: 'World',
  userId: userId
}).returning()
```

### Update
```typescript
await db.update(posts)
  .set({ title: 'Updated' })
  .where(and(
    eq(posts.id, postId),
    eq(posts.userId, userId)
  ))
```

### Delete
```typescript
await db.delete(posts)
  .where(and(
    eq(posts.id, postId),
    eq(posts.userId, userId)
  ))
```

## Important Rules

1. **ALWAYS scope by userId** - Every query touching user data must have `eq(table.userId, userId)`
2. **Use getUserId()** - Get the current user ID from the session
3. **Never expose secrets** - DATABASE_URL and BETTER_AUTH_SECRET never in client code
4. **HTTP-only cookies** - Session cookies are sent with every request automatically
5. **Revalidate after mutations** - Use `revalidatePath()` to refresh cached pages

## Debugging

### Check if user is logged in
```typescript
const session = await auth.api.getSession({ headers: await headers() })
console.log(session?.user)
```

### Test server action
```typescript
// In browser console after signing in:
fetch('/api/auth/session').then(r => r.json()).then(console.log)
```

### View database
- Open Neon dashboard
- Check tables: user, session, account, verification

## Deployment

1. Set environment variables in Vercel:
   - DATABASE_URL
   - DATABASE_URL_UNPOOLED  
   - BETTER_AUTH_SECRET

2. Database is auto-managed by Better Auth
   - Tables created on first signup
   - No migrations needed

3. Sessions work with Vercel deployments
   - baseURL auto-detects production URL
   - trustedOrigins includes all environments

## Troubleshooting

**User signed up but can't sign in:**
- Session created? Check: `const session = await auth.api.getSession(...)`
- Cookie sent? Check: Network tab → find session cookie
- Secret set? Check: env var BETTER_AUTH_SECRET exists

**"Unauthorized" in server actions:**
- Is `getUserId()` being called?
- Is request from authenticated page?
- Did you check session first?

**Database connection timeout:**
- Check DATABASE_URL format
- Verify Neon project is active
- Restart dev server

**userId column errors:**
- When adding custom tables, always add: `userId: text('userId').notNull()`
- This is required for multi-user safety

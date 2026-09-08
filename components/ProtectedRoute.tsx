'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

interface SessionResponse {
  user: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } | null;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { data, error, isLoading } = useSWR<SessionResponse>('/api/auth/session', async (url) => {
    const response = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
    if (!response.ok) throw new Error('Session check failed')
    return response.json()
  }, { revalidateOnFocus: false, shouldRetryOnError: false });
  const role = typeof data?.user?.app_metadata?.role === 'string' ? data.user.app_metadata.role : undefined;
  const hasRequiredRole = !requiredRole?.length || (role ? requiredRole.includes(role) : false);

  useEffect(() => {
    if (!isLoading && (!data?.user || error || !hasRequiredRole)) {
      router.replace(!data?.user ? '/sign-in' : '/home');
    }
  }, [data?.user, error, hasRequiredRole, isLoading, router]);

  if (isLoading || !data?.user || !hasRequiredRole) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground" role="status">Checking your account…</p>
      </main>
    );
  }

  return <>{children}</>;
}

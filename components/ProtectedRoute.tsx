'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ApiClient from '@/lib/api-client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  redirectPath?: string;
}

export function ProtectedRoute({ children, requiredRole, redirectPath = '/login' }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  const refreshAccessToken = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        return true;
      }
    } catch (error) {
      console.error('[v0] Token refresh failed:', error);
    }
    return false;
  };

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        let token = localStorage.getItem('access_token');

        if (!token) {
          router.push(redirectPath);
          return;
        }

        // Set token in API client
        ApiClient.setToken(token);

        // Verify token with backend
        let response = await ApiClient.verifyToken();

        // If token expired, try refresh
        if (!response.valid) {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            token = localStorage.getItem('access_token')!;
            ApiClient.setToken(token);
            response = await ApiClient.verifyToken();
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            router.push(redirectPath);
            return;
          }
        }

        if (response.valid) {
          setUserRole(response.role);

          // Check if user has required role
          if (requiredRole && !requiredRole.includes(response.role)) {
            router.push('/unauthorized');
            return;
          }

          setIsAuthenticated(true);
        } else {
          // Token invalid even after refresh
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          router.push(redirectPath);
        }
      } catch (error) {
        console.error('[v0] Auth verification failed:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push(redirectPath);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [router, requiredRole, redirectPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

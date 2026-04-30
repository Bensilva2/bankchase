'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ApiClient from '@/lib/api-client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');

        if (!token) {
          router.push('/login');
          return;
        }

        // Set token in API client
        ApiClient.setToken(token);

        // Verify token with backend
        const response = await ApiClient.verifyToken();

        if (response.valid) {
          setUserRole(response.role);

          // Check if user has required role
          if (requiredRole && !requiredRole.includes(response.role)) {
            router.push('/accounts');
            return;
          }

          setIsAuthenticated(true);
        } else {
          // Token invalid
          localStorage.removeItem('access_token');
          router.push('/login');
        }
      } catch (error) {
        console.error('[v0] Auth verification failed:', error);
        localStorage.removeItem('access_token');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [router, requiredRole]);

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

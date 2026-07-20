'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main Chase dashboard
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-card">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}

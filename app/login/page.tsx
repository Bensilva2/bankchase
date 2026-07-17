'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { SignInButton } from '@clerk/nextjs';

export default function LoginPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isLoaded && userId) {
      router.push('/accounts');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-card">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-card dark:from-background dark:via-background dark:to-card">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Chase</h1>
            <p className="text-muted-foreground mt-2">Secure Sign In</p>
          </div>

          {/* Clerk SignIn */}
          <div className="flex justify-center">
            <SignInButton mode="modal" forceRedirectUrl="/accounts">
              <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-lg transition">
                Sign In with Clerk
              </button>
            </SignInButton>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">or</span>
            </div>
          </div>

          {/* Signup Link */}
          <p className="text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline font-semibold">
              Sign up
            </Link>
          </p>

          {/* Help Links */}
          <div className="mt-8 pt-6 border-t border-border space-y-2 text-sm text-center">
            <p>
              <Link href="/help" className="text-primary hover:underline">
                Need help?
              </Link>
            </p>
            <p>
              <Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ApiClient from '@/lib/api-client';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const router = useRouter();

  const validatePassword = (pwd: string) => {
    const errors: string[] = [];
    
    if (pwd.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('Must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push('Must contain at least one number');
    }
    
    return errors;
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    if (pwd) {
      setPasswordErrors(validatePassword(pwd));
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    const errors = validatePassword(password);
    if (errors.length > 0) {
      setError('Password does not meet requirements');
      setLoading(false);
      return;
    }

    try {
      const response = await ApiClient.signup(email, password, firstName, lastName);
      
      // Store token and redirect
      if (response.access_token) {
        router.push('/accounts');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If already logged in, redirect to dashboard
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      router.push('/accounts');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600">Chase</h1>
            <p className="text-gray-500 mt-2">Create your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              role="alert"
              className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm"
            >
              {error}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name Fields Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label 
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John"
                  disabled={loading}
                />
              </div>
              <div>
                <label 
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Doe"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label 
                htmlFor="signupEmail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="signupEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
                required
                disabled={loading}
                aria-required="true"
              />
            </div>

            {/* Password */}
            <div>
              <label 
                htmlFor="signupPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="signupPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  aria-required="true"
                  aria-describedby="password-requirements"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? '👁️' : '🔒'}
                </button>
              </div>

              {/* Password Requirements */}
              {password && (
                <div 
                  id="password-requirements"
                  className="mt-2 p-3 bg-gray-50 rounded border border-gray-200"
                  role="region"
                  aria-live="polite"
                >
                  <p className="text-xs font-semibold text-gray-600 mb-2">Password Requirements:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className={password.length >= 8 ? 'text-green-600' : 'text-gray-600'}>
                      {password.length >= 8 ? '✓' : '○'} At least 8 characters
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-600'}>
                      {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-600'}>
                      {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                    </li>
                    <li className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-600'}>
                      {/[0-9]/.test(password) ? '✓' : '○'} One number
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label 
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
                disabled={loading}
                aria-required="true"
              />
              {confirmPassword && password !== confirmPassword && (
                <p 
                  className="text-red-600 text-xs mt-1"
                  role="alert"
                >
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || passwordErrors.length > 0 || !email || !password || password !== confirmPassword}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
              aria-busy={loading}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

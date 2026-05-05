'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("If your email is registered, a password reset link has been sent.");
      } else {
        setError(data.detail || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Chase Logo */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 text-5xl font-bold shadow-xl">
              C
            </div>
            <div>
              <h1 className="text-white text-4xl font-bold tracking-tight">Chase</h1>
              <p className="text-blue-200 text-sm -mt-1">Admin Portal</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-2xl font-semibold text-center mb-2">Forgot Password?</h2>
          <p className="text-gray-600 text-center mb-8">
            Enter your email and we'll send you a reset link
          </p>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl mb-6 text-center">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@chasebank.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-lg disabled:opacity-70 transition-all"
            >
              {loading ? "Sending Reset Link..." : "Send Reset Link"}
            </button>
          </form>

          <div className="text-center mt-8">
            <Link href="/admin/login" className="text-blue-600 hover:underline text-sm">
              ← Back to Sign In
            </Link>
          </div>
        </div>

        <p className="text-center text-blue-200 text-sm mt-8">
          Chase Bank Admin Portal © 2026
        </p>
      </div>
    </div>
  );
}

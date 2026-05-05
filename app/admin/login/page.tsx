'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ApiClient from '@/lib/api-client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await ApiClient.login(form.email, form.password);

      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        router.push('/admin');
      } else {
        setError('No token received from server');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
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
          <h2 className="text-2xl font-semibold text-center mb-8">Sign in to continue</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm">
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
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-lg transition-all disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="text-center mt-8">
            <a href="/admin/forgot-password" className="text-blue-600 hover:underline text-sm">
              Forgot Password?
            </a>
          </div>
        </div>

        <p className="text-center text-blue-200 text-sm mt-8">
          Chase Bank Admin Portal © 2026
        </p>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.new_password !== form.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    if (form.new_password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          new_password: form.new_password
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/login');
        }, 2000);
      } else {
        setError(data.detail || "Failed to reset password");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-semibold mb-3">Password Reset Successful</h2>
          <p className="text-gray-600">You will be redirected to login shortly...</p>
        </div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-semibold text-center mb-2">Reset Your Password</h2>
          <p className="text-gray-600 text-center mb-8">Enter your new password</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                required
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                value={form.new_password}
                onChange={(e) => setForm({ ...form, new_password: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                required
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                value={form.confirm_password}
                onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-lg disabled:opacity-70 transition-all"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>

          <div className="text-center mt-8">
            <a href="/admin/login" className="text-blue-600 hover:underline text-sm">
              ← Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <Lock className="w-12 h-12 text-red-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-8">
          You don&apos;t have permission to access this page. Contact your administrator if you believe this is an error.
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/dashboard" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </Link>
          <Link 
            href="/login" 
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Sign Out
          </Link>
        </div>
      </div>
    </div>
  );
}

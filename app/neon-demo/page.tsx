'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { NeonCommentForm } from '@/components/neon-comment-form';
import { NeonCommentsList } from '@/components/neon-comments-list';

export default function NeonDemoPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCommentAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">
            Neon Database Demo
          </h1>
          <p className="text-lg text-slate-600">
            Real-time comments powered by PostgreSQL and Neon
          </p>
        </div>

        {/* Form Section */}
        <Card className="p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-slate-800">
            Add Your Comment
          </h2>
          <NeonCommentForm onCommentAdded={handleCommentAdded} />
        </Card>

        {/* Comments Section */}
        <Card className="p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-slate-800">
            Recent Comments
          </h2>
          <NeonCommentsList refreshTrigger={refreshTrigger} />
        </Card>

        {/* Info Section */}
        <Card className="p-6 bg-blue-50 border-blue-200 shadow-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            About This Demo
          </h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>✓ Uses Neon serverless PostgreSQL driver</li>
            <li>✓ Comments are stored in a PostgreSQL database</li>
            <li>✓ Real-time updates across all users</li>
            <li>✓ Built with Next.js Server Actions</li>
            <li>✓ No client-side state management needed</li>
          </ul>
        </Card>
      </div>
    </main>
  );
}

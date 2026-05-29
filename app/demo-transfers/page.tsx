import { DemoTransferHub } from '@/components/demo-transfer-hub';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Demo Money Transfers - MyBank',
  description: 'Track your demo money transfers and pending refunds',
};

export default function DemoTransfersPage() {
  // In production, get user ID from session
  const userId = 'user-demo-123'; // Placeholder

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <DemoTransferHub userId={userId} />
      </div>
    </main>
  );
}

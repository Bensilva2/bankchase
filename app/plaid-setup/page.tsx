import { PlaidAccountsManager } from '@/components/plaid-accounts-manager';
import { PlaidAnalyticsDashboard } from '@/components/plaid-analytics-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata = {
  title: 'Plaid Integration - MyBank',
  description: 'Link bank accounts and manage real banking data',
};

export default function PlaidSetupPage() {
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Plaid Integration</h1>
          <p className="text-muted-foreground">
            Connect your real bank accounts and monitor your financial data with Plaid
          </p>
        </div>

        <Tabs defaultValue="accounts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="mt-6">
            <PlaidAccountsManager />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <PlaidAnalyticsDashboard />
          </TabsContent>
        </Tabs>

        {/* Information Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">🔐 Secure Connection</h3>
            <p className="text-sm text-muted-foreground">
              All bank connections are encrypted end-to-end. Your login credentials are never shared with MyBank.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">📊 Real-Time Data</h3>
            <p className="text-sm text-muted-foreground">
              Get instant access to your transaction history, balances, and account details across all institutions.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">📈 Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Monitor Link integration performance with detailed analytics and error tracking.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

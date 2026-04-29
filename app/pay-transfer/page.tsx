'use client';

import { useState } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import ApiClient from '@/lib/api-client';
import { Send, Plus, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function PayTransferPage() {
  const { accounts } = useAccounts();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    from_account_number: '',
    to_account_number: '',
    to_bank_code: 'INTERNAL',
    amount: '',
    narration: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.from_account_number || !formData.to_account_number || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await ApiClient.sendMoney({
        from_account_number: formData.from_account_number,
        to_account_number: formData.to_account_number,
        to_bank_code: formData.to_bank_code,
        amount: parseFloat(formData.amount),
        narration: formData.narration,
      });

      toast.success('Transfer initiated successfully');
      setFormData({
        from_account_number: '',
        to_account_number: '',
        to_bank_code: 'INTERNAL',
        amount: '',
        narration: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send money');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Pay & Transfer</h1>
          <p className="text-muted-foreground">Send money to accounts and pay bills</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition text-left group">
            <Send className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition" />
            <p className="font-semibold text-foreground">Send Money</p>
            <p className="text-sm text-muted-foreground mt-1">Transfer to any account</p>
          </button>
          <button className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition text-left group">
            <Plus className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition" />
            <p className="font-semibold text-foreground">Pay Bills</p>
            <p className="text-sm text-muted-foreground mt-1">Utilities, cards, subscriptions</p>
          </button>
          <button className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition text-left group">
            <Zap className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition" />
            <p className="font-semibold text-foreground">Scheduled</p>
            <p className="text-sm text-muted-foreground mt-1">Automatic recurring payments</p>
          </button>
        </div>

        {/* Transfer Form */}
        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Send Money</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* From Account */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                From Account
              </label>
              <select
                name="from_account_number"
                value={formData.from_account_number}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select an account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.account_number}>
                    {acc.account_type} - {acc.account_number} (${acc.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* To Account */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                To Account Number
              </label>
              <input
                type="text"
                name="to_account_number"
                placeholder="Enter recipient account number"
                value={formData.to_account_number}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Bank Code */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Bank
              </label>
              <select
                name="to_bank_code"
                value={formData.to_bank_code}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="INTERNAL">Chase Internal</option>
                <option value="JPM">JP Morgan Chase</option>
                <option value="BAC">Bank of America</option>
                <option value="WFC">Wells Fargo</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground">$</span>
                <input
                  type="number"
                  name="amount"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                  className="w-full pl-8 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Narration */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Reason (Optional)
              </label>
              <input
                type="text"
                name="narration"
                placeholder="e.g., Monthly rent, Gift, etc."
                value={formData.narration}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              {isLoading ? 'Processing...' : 'Send Money'}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-semibold">Note:</span> Internal Chase transfers are instant. External transfers may show as pending and will auto-refund after 7-14 days for demo accounts.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * API Client for Chase Bank Voice Agent Platform
 * Handles all backend communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

export class ApiClient {
  private static token: string | null = null;

  static setToken(token: string) {
    this.token = token;
  }

  static clearToken() {
    this.token = null;
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: error.detail || error.message || 'API Error',
        detail: error.detail,
      } as ApiError;
    }

    return response.json();
  }

  // Authentication
  static async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store token
    if (data.access_token) {
      this.setToken(data.access_token);
      localStorage.setItem('access_token', data.access_token);
    }
    
    return data;
  }

  static async signup(email: string, password: string, firstName: string = '', lastName: string = '') {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password,
        first_name: firstName,
        last_name: lastName,
      }),
    });
    
    // Store token
    if (data.access_token) {
      this.setToken(data.access_token);
      localStorage.setItem('access_token', data.access_token);
    }
    
    return data;
  }

  static async verifyToken() {
    return this.request('/auth/verify', { method: 'GET' });
  }

  static async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearToken();
    localStorage.removeItem('access_token');
  }

  // Navigation
  static async getNavigation() {
    return this.request('/navigation/main');
  }

  // Accounts
  static async getAccounts() {
    return this.request('/accounts/');
  }

  static async getAccount(accountId: number) {
    return this.request(`/accounts/${accountId}`);
  }

  // Transactions
  static async getTransactions(accountId?: number, limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (accountId) params.append('account_id', accountId.toString());
    return this.request(`/transactions/history?${params}`);
  }

  // Pay & Transfer
  static async sendMoney(data: {
    from_account_number: string;
    to_account_number: string;
    to_bank_code: string;
    amount: number;
    narration?: string;
  }) {
    return this.request('/pay-transfer/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Demo Balance
  static async getDemoBalance() {
    return this.request('/user/demo/balance');
  }

  static async getPendingDemoFunds() {
    return this.request('/user/demo/pending-funds');
  }

  // Admin - Demo Transfers
  static async adminSingleTransfer(data: {
    to_account_number: string;
    amount: number;
    to_bank_code: string;
    days_to_refund?: number;
    narration?: string;
  }) {
    return this.request('/admin/demo/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async adminBulkTransfer(data: {
    amount: number;
    days_to_refund?: number;
  }) {
    return this.request('/admin/demo/bulk-to-all-users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getAdminTransfers(limit = 50, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return this.request(`/admin/demo/transfers?${params}`);
  }

  static async getAdminStats() {
    return this.request('/admin/demo/stats');
  }

  // Voice Stream WebSocket
  static connectVoiceStream(userId: string, orgId: string, token: string) {
    const wsUrl = `${API_BASE_URL.replace(/^http/, 'ws')}/ws/voice/stream/${userId}/${orgId}?token=${token}`;
    return new WebSocket(wsUrl);
  }

  // Security
  static async getSecurityMetrics() {
    return this.request('/admin/security/metrics');
  }

  static async getSecurityAlerts() {
    return this.request('/admin/security/alerts');
  }

  static async getDriftAnalysis(userId: string) {
    return this.request(`/admin/security/drift/${userId}`);
  }
}

export default ApiClient;

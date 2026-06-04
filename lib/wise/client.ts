import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface WiseTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface WiseTokenCache {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
}

// In-memory token cache (in production, use Redis or database)
let tokenCache: WiseTokenCache | null = null;

const WISE_API_BASE_URL = process.env.WISE_API_ENVIRONMENT === 'production'
  ? 'https://api.wise.com'
  : 'https://api.wise-sandbox.com';

export class WiseClient {
  private axiosInstance: AxiosInstance;
  private clientId: string;
  private clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.axiosInstance = axios.create({
      baseURL: WISE_API_BASE_URL,
      timeout: 10000,
    });

    // Add request interceptor for token refresh
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for rate limiting
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
          
          console.log(`[Wise] Rate limited. Retrying after ${delayMs}ms`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          
          return this.axiosInstance(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  private async getAccessToken(): Promise<string> {
    // Check if cached token is still valid
    if (tokenCache && tokenCache.expiresAt > Date.now()) {
      return tokenCache.accessToken;
    }

    // Request new token
    const response = await axios.post<WiseTokenResponse>(
      `${WISE_API_BASE_URL}/oauth/token`,
      {
        grant_type: 'client_credentials',
        scope: 'transfers',
      },
      {
        auth: {
          username: this.clientId,
          password: this.clientSecret,
        },
        timeout: 10000,
      }
    );

    tokenCache = {
      accessToken: response.data.access_token,
      expiresAt: Date.now() + response.data.expires_in * 1000 - 60000, // Refresh 1 min before expiry
      refreshToken: response.data.refresh_token,
    };

    return tokenCache.accessToken;
  }

  // API Methods with idempotency support
  async createQuote(params: {
    profileId: number;
    sourceCurrency: string;
    targetCurrency: string;
    sourceAmount?: number;
    targetAmount?: number;
  }) {
    return this.axiosInstance.post('/v3/quotes', {
      profile: params.profileId,
      sourceCurrency: params.sourceCurrency,
      targetCurrency: params.targetCurrency,
      sourceAmount: params.sourceAmount,
      targetAmount: params.targetAmount,
    });
  }

  async getQuote(quoteId: string) {
    return this.axiosInstance.get(`/v3/quotes/${quoteId}`);
  }

  async createRecipient(params: {
    profileId: number;
    accountHolderName: string;
    currency: string;
    details: Record<string, unknown>;
  }) {
    return this.axiosInstance.post('/v1/recipient_accounts', {
      profile: params.profileId,
      accountHolderName: params.accountHolderName,
      currency: params.currency,
      details: params.details,
    });
  }

  async createTransfer(params: {
    profileId: number;
    quoteUuid: string;
    targetAccountId: number;
    customerTransactionId?: string;
    details?: Record<string, unknown>;
  }) {
    // Generate idempotency key if not provided
    const idempotencyKey = params.customerTransactionId || uuidv4();

    return this.axiosInstance.post(
      '/v3/transfers',
      {
        transferRequest: {
          details: params.details,
          quoteUuid: params.quoteUuid,
          targetAccountId: params.targetAccountId,
          customerTransactionId: idempotencyKey,
        },
      },
      {
        headers: {
          'X-idempotence-uuid': idempotencyKey,
        },
      }
    );
  }

  async fundTransfer(transferId: string, params: {
    type: string; // 'BALANCE' | 'BANK_TRANSFER'
  }) {
    return this.axiosInstance.post(`/v3/transfers/${transferId}/fund`, {
      type: params.type,
    });
  }

  async getTransfer(transferId: string) {
    return this.axiosInstance.get(`/v3/transfers/${transferId}`);
  }

  async getTransfers(profileId: number, params?: {
    limit?: number;
    offset?: number;
  }) {
    return this.axiosInstance.get('/v3/transfers', {
      params: {
        profile: profileId,
        limit: params?.limit || 10,
        offset: params?.offset || 0,
      },
    });
  }

  async getBalance(balanceId: string) {
    return this.axiosInstance.get(`/v4/accounts/${balanceId}`);
  }

  async getBalances(profileId: number) {
    return this.axiosInstance.get('/v4/accounts', {
      params: {
        profile: profileId,
      },
    });
  }

  async getProfile(profileId: number) {
    return this.axiosInstance.get(`/v2/profiles/${profileId}`);
  }

  async getCurrentUser() {
    return this.axiosInstance.get('/v2/me');
  }

  // Utility to get the client instance for advanced usage
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Singleton instance
let wiseClientInstance: WiseClient | null = null;

export function getWiseClient(): WiseClient {
  if (!wiseClientInstance) {
    const clientId = process.env.WISE_CLIENT_ID;
    const clientSecret = process.env.WISE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Missing Wise API credentials');
    }

    wiseClientInstance = new WiseClient(clientId, clientSecret);
  }

  return wiseClientInstance;
}

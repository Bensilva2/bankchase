import PaymentProvider, { PaymentProviderConfig } from './payment-provider-base';
import CurrencyCloudProvider from './currencycloud-provider';

/**
 * Payment Provider Factory
 * Creates and manages payment provider instances
 */
export class PaymentProviderFactory {
  private static providers: Map<string, PaymentProvider> = new Map();

  /**
   * Get or create a payment provider instance
   */
  static getProvider(providerName: string): PaymentProvider {
    // Check if provider already instantiated
    if (this.providers.has(providerName)) {
      return this.providers.get(providerName)!;
    }

    // Create new provider
    const provider = this.createProvider(providerName);
    this.providers.set(providerName, provider);
    return provider;
  }

  /**
   * Create a new payment provider instance
   */
  private static createProvider(providerName: string): PaymentProvider {
    switch (providerName.toLowerCase()) {
      case 'currencycloud':
        return new CurrencyCloudProvider(
          this.getCurrencyCloudConfig()
        );

      case 'swift':
        // TODO: Implement SWIFT provider
        throw new Error('SWIFT provider not yet implemented');

      case 'thunes':
        // TODO: Implement Thunes provider
        throw new Error('Thunes provider not yet implemented');

      default:
        throw new Error(`Unknown payment provider: ${providerName}`);
    }
  }

  /**
   * Get Currencycloud configuration from environment
   */
  private static getCurrencyCloudConfig(): PaymentProviderConfig {
    const apiKey = process.env.CURRENCYCLOUD_API_KEY;
    const apiSecret = process.env.CURRENCYCLOUD_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error(
        'Currencycloud credentials not configured. Set CURRENCYCLOUD_API_KEY and CURRENCYCLOUD_API_SECRET.'
      );
    }

    return {
      apiKey,
      apiSecret,
      endpoint: process.env.CURRENCYCLOUD_ENDPOINT || 'https://api.currencycloud.com/v2',
      timeout: 30000,
      clientCert: process.env.MTLS_CLIENT_CERT_PATH,
      clientKey: process.env.MTLS_CLIENT_KEY_PATH,
      caCert: process.env.MTLS_CA_CERT_PATH,
    };
  }

  /**
   * Get the default payment provider for the application
   */
  static getDefaultProvider(): PaymentProvider {
    const defaultProvider = process.env.DEFAULT_PAYMENT_PROVIDER || 'currencycloud';
    return this.getProvider(defaultProvider);
  }

  /**
   * Register a custom payment provider implementation
   */
  static registerProvider(
    name: string,
    providerInstance: PaymentProvider
  ): void {
    this.providers.set(name, providerInstance);
    console.log(`[PaymentProviderFactory] Registered provider: ${name}`);
  }

  /**
   * List all registered providers
   */
  static listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Clear all cached provider instances
   */
  static clearProviders(): void {
    this.providers.clear();
    console.log('[PaymentProviderFactory] All providers cleared');
  }
}

export default PaymentProviderFactory;

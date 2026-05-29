import fs from 'fs';
import path from 'path';
import https from 'https';

/**
 * mTLS (Mutual TLS) Certificate Manager
 * Handles certificate loading and HTTPS client creation for secure
 * communication with cross-border payment providers (SWIFT, Currencycloud)
 */
export class MTLSCertificateManager {
  private clientCertPath: string;
  private clientKeyPath: string;
  private caCertPath: string;
  private httpsAgent: https.Agent | null = null;

  constructor(
    clientCertPath?: string,
    clientKeyPath?: string,
    caCertPath?: string
  ) {
    // Use environment variables or provided paths
    this.clientCertPath =
      clientCertPath || process.env.MTLS_CLIENT_CERT_PATH || '';
    this.clientKeyPath = clientKeyPath || process.env.MTLS_CLIENT_KEY_PATH || '';
    this.caCertPath = caCertPath || process.env.MTLS_CA_CERT_PATH || '';

    if (!this.clientCertPath || !this.clientKeyPath) {
      console.warn(
        '[MTLSCertificateManager] mTLS certificates not configured. Ensure MTLS_CLIENT_CERT_PATH and MTLS_CLIENT_KEY_PATH are set.'
      );
    }
  }

  /**
   * Load certificates from file system
   * Validates that files exist and are readable
   */
  private loadCertificates(): {
    cert: string;
    key: string;
    ca?: string;
  } | null {
    try {
      if (!fs.existsSync(this.clientCertPath)) {
        throw new Error(
          `Client certificate not found: ${this.clientCertPath}`
        );
      }
      if (!fs.existsSync(this.clientKeyPath)) {
        throw new Error(`Client key not found: ${this.clientKeyPath}`);
      }

      const cert = fs.readFileSync(this.clientCertPath, 'utf-8');
      const key = fs.readFileSync(this.clientKeyPath, 'utf-8');

      let ca: string | undefined;
      if (this.caCertPath && fs.existsSync(this.caCertPath)) {
        ca = fs.readFileSync(this.caCertPath, 'utf-8');
      }

      console.log('[MTLSCertificateManager] Certificates loaded successfully');
      return { cert, key, ca };
    } catch (error) {
      console.error(
        '[MTLSCertificateManager] Error loading certificates:',
        error
      );
      return null;
    }
  }

  /**
   * Create HTTPS agent with mTLS configuration
   * Used for making authenticated requests to payment providers
   */
  getHTTPSAgent(): https.Agent {
    if (this.httpsAgent) {
      return this.httpsAgent;
    }

    const certs = this.loadCertificates();
    if (!certs) {
      throw new Error(
        'Failed to load mTLS certificates. Cannot create HTTPS agent.'
      );
    }

    this.httpsAgent = new https.Agent({
      cert: certs.cert,
      key: certs.key,
      ca: certs.ca,
      rejectUnauthorized: true, // Enforce certificate validation
    });

    console.log('[MTLSCertificateManager] HTTPS agent created with mTLS');
    return this.httpsAgent;
  }

  /**
   * Get certificates for custom HTTP client configuration
   * (e.g., for axios, fetch, or other HTTP libraries)
   */
  getCertificates(): {
    cert: string;
    key: string;
    ca?: string;
  } | null {
    return this.loadCertificates();
  }

  /**
   * Validate certificate expiry
   * Warns if certificate is expiring soon
   */
  validateCertificateExpiry(): boolean {
    try {
      const certContent = fs.readFileSync(this.clientCertPath, 'utf-8');

      // Extract expiry date using regex
      // Format: notAfter=YYYY-MM-DD HH:MM:SS
      const expiryMatch = certContent.match(/notAfter=([^\n]+)/);
      if (!expiryMatch) {
        console.warn(
          '[MTLSCertificateManager] Could not determine certificate expiry'
        );
        return true;
      }

      const expiryDate = new Date(expiryMatch[1]);
      const now = new Date();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      if (expiryDate.getTime() - now.getTime() < thirtyDaysMs) {
        console.warn(
          `[MTLSCertificateManager] Certificate expires soon: ${expiryDate.toISOString()}`
        );
      }

      return expiryDate > now;
    } catch (error) {
      console.error(
        '[MTLSCertificateManager] Error validating certificate expiry:',
        error
      );
      return true;
    }
  }
}

export const mtlsCertificateManager = new MTLSCertificateManager();

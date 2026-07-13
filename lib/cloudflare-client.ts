/**
 * Cloudflare API Client
 * Handles DNS, R2 storage, and other Cloudflare operations
 */

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

interface CloudflareRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Make authenticated request to Cloudflare API
 */
async function cloudflareRequest(
  endpoint: string,
  options: CloudflareRequestOptions = {}
) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!token || !accountId) {
    throw new Error(
      "Missing Cloudflare credentials: CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID"
    );
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${CLOUDFLARE_API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Cloudflare API error: ${error.errors?.[0]?.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get DNS records for a zone
 */
export async function getDNSRecords(zoneId: string, type?: string) {
  const endpoint = `/zones/${zoneId}/dns_records${type ? `?type=${type}` : ""}`;
  const result = await cloudflareRequest(endpoint);
  return result.result || [];
}

/**
 * Create DNS record
 */
export async function createDNSRecord(
  zoneId: string,
  record: {
    type: string;
    name: string;
    content: string;
    ttl?: number;
    proxied?: boolean;
  }
) {
  const endpoint = `/zones/${zoneId}/dns_records`;
  const result = await cloudflareRequest(endpoint, {
    method: "POST",
    body: record,
  });
  return result.result;
}

/**
 * Update DNS record
 */
export async function updateDNSRecord(
  zoneId: string,
  recordId: string,
  record: {
    type: string;
    name: string;
    content: string;
    ttl?: number;
    proxied?: boolean;
  }
) {
  const endpoint = `/zones/${zoneId}/dns_records/${recordId}`;
  const result = await cloudflareRequest(endpoint, {
    method: "PATCH",
    body: record,
  });
  return result.result;
}

/**
 * Delete DNS record
 */
export async function deleteDNSRecord(zoneId: string, recordId: string) {
  const endpoint = `/zones/${zoneId}/dns_records/${recordId}`;
  const result = await cloudflareRequest(endpoint, {
    method: "DELETE",
  });
  return result.result;
}

/**
 * List R2 buckets
 */
export async function listR2Buckets() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accountId) {
    throw new Error("Missing CLOUDFLARE_ACCOUNT_ID");
  }

  const endpoint = `/accounts/${accountId}/r2/buckets`;
  const result = await cloudflareRequest(endpoint);
  return result.result || [];
}

/**
 * Get R2 bucket info
 */
export async function getR2BucketInfo(bucketName: string) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accountId) {
    throw new Error("Missing CLOUDFLARE_ACCOUNT_ID");
  }

  const endpoint = `/accounts/${accountId}/r2/buckets/${bucketName}`;
  const result = await cloudflareRequest(endpoint);
  return result.result;
}

/**
 * Get zone details
 */
export async function getZoneInfo(zoneId: string) {
  const endpoint = `/zones/${zoneId}`;
  const result = await cloudflareRequest(endpoint);
  return result.result;
}

/**
 * Purge cache for zone
 */
export async function purgeCacheByTag(zoneId: string, tags: string[]) {
  const endpoint = `/zones/${zoneId}/purge_cache`;
  const result = await cloudflareRequest(endpoint, {
    method: "POST",
    body: { tags },
  });
  return result.result;
}

/**
 * Get zone SSL/TLS status
 */
export async function getSSLStatus(zoneId: string) {
  const endpoint = `/zones/${zoneId}/settings/ssl`;
  const result = await cloudflareRequest(endpoint);
  return result.result;
}

/**
 * Update zone settings
 */
export async function updateZoneSetting(
  zoneId: string,
  settingId: string,
  value: any
) {
  const endpoint = `/zones/${zoneId}/settings/${settingId}`;
  const result = await cloudflareRequest(endpoint, {
    method: "PATCH",
    body: { value },
  });
  return result.result;
}

/**
 * Get rate limit rules
 */
export async function getRateLimitRules(zoneId: string) {
  const endpoint = `/zones/${zoneId}/rate_limit`;
  const result = await cloudflareRequest(endpoint);
  return result.result || [];
}

/**
 * Create rate limit rule
 */
export async function createRateLimitRule(
  zoneId: string,
  rule: {
    match: { request: { url: { path_contains: string } } };
    action: { mode: string };
    threshold: number;
    period: number;
    description?: string;
  }
) {
  const endpoint = `/zones/${zoneId}/rate_limit`;
  const result = await cloudflareRequest(endpoint, {
    method: "POST",
    body: rule,
  });
  return result.result;
}

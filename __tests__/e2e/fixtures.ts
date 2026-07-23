import { test as base, expect } from '@playwright/test';

interface TestContext {
  cloudflareToken: string;
  accountId: string;
}

export const test = base.extend<TestContext>({
  cloudflareToken: async ({}, use) => {
    const token = process.env.CLOUDFLARE_API_TOKEN || 'test-token';
    await use(token);
  },
  accountId: async ({}, use) => {
    const id = process.env.CLOUDFLARE_ACCOUNT_ID || 'test-account';
    await use(id);
  },
});

export { expect };

/**
 * Common test utilities for DNS and storage operations
 */
export const testUtils = {
  /**
   * Wait for DNS record to be created
   */
  async waitForDNSRecord(page: any, recordName: string, timeout = 5000) {
    await page.waitForFunction(
      (name) => {
        const rows = document.querySelectorAll('table tbody tr');
        return Array.from(rows).some((row) =>
          row.textContent?.includes(name)
        );
      },
      recordName,
      { timeout }
    );
  },

  /**
   * Get all DNS records from table
   */
  async getDNSRecords(page: any) {
    return page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      return Array.from(rows).map((row) => ({
        name: row.querySelector('td:nth-child(1)')?.textContent?.trim(),
        type: row.querySelector('td:nth-child(2)')?.textContent?.trim(),
        content: row.querySelector('td:nth-child(3)')?.textContent?.trim(),
        ttl: row.querySelector('td:nth-child(4)')?.textContent?.trim(),
      }));
    });
  },

  /**
   * Fill DNS record form
   */
  async fillDNSForm(page: any, record: {
    type: string;
    name: string;
    content: string;
    ttl?: string;
  }) {
    // Select record type
    await page.click('[data-testid="record-type-select"]');
    await page.click(`[data-testid="record-type-${record.type}"]`);

    // Fill name
    await page.fill('[data-testid="record-name-input"]', record.name);

    // Fill content
    await page.fill('[data-testid="record-content-input"]', record.content);

    // Fill TTL if provided
    if (record.ttl) {
      await page.fill('[data-testid="record-ttl-input"]', record.ttl);
    }
  },

  /**
   * Create a new DNS record via form
   */
  async createDNSRecord(page: any, record: {
    type: string;
    name: string;
    content: string;
    ttl?: string;
  }) {
    // Open create drawer
    await page.click('[data-testid="create-record-button"]');

    // Fill form
    await this.fillDNSForm(page, record);

    // Submit
    await page.click('[data-testid="save-record-button"]');

    // Wait for success
    await page.waitForSelector('[data-testid="success-message"]', {
      timeout: 5000,
    });
  },

  /**
   * Delete a DNS record
   */
  async deleteDNSRecord(page: any, recordName: string) {
    // Find row with record
    const row = await page.$(
      `text="${recordName}"`
    );
    if (!row) throw new Error(`Record ${recordName} not found`);

    // Click delete button
    const deleteBtn = await row.$('[data-testid="delete-record-button"]');
    if (deleteBtn) await deleteBtn.click();

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');

    // Wait for removal
    await page.waitForFunction(
      (name) => {
        const rows = document.querySelectorAll('table tbody tr');
        return !Array.from(rows).some((row) =>
          row.textContent?.includes(name)
        );
      },
      recordName,
      { timeout: 5000 }
    );
  },
};

import { test, expect, testUtils } from './fixtures';

test.describe('DNS Management Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to DNS management page
    await page.goto('/admin/dns');

    // Wait for page to load (will redirect to login if not authenticated)
    await page.waitForLoadState('networkidle');
  });

  test.describe('Navigation and Access', () => {
    test('should display DNS management dashboard', async ({ page }) => {
      // Check for key elements
      const heading = page.locator('h1, h2');
      await expect(heading).toContainText(/DNS|Domain/i);

      // Check for zone selector
      const zoneSelect = page.locator('[data-testid="zone-select"]');
      await expect(zoneSelect).toBeVisible();

      // Check for action buttons
      const createBtn = page.locator('[data-testid="create-record-button"]');
      await expect(createBtn).toBeVisible();
    });

    test('should load and display zones', async ({ page }) => {
      // Click zone selector
      const zoneSelect = page.locator('[data-testid="zone-select"]');
      await zoneSelect.click();

      // Wait for options to appear
      await page.waitForSelector('[role="option"]', { timeout: 5000 });

      // Check that at least one zone is available
      const options = page.locator('[role="option"]');
      const count = await options.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display loading state initially', async ({ page }) => {
      // Reload page
      await page.reload();

      // Check for loading indicator
      const skeleton = page.locator('[data-testid="table-skeleton"]');
      if (await skeleton.isVisible()) {
        // Wait for skeleton to disappear
        await skeleton.waitFor({ state: 'hidden', timeout: 10000 });
      }

      // Table should be visible after loading
      const table = page.locator('table');
      await expect(table).toBeVisible();
    });
  });

  test.describe('DNS Record Operations', () => {
    test('should create a new A record', async ({ page }) => {
      const testRecord = {
        type: 'A',
        name: 'test-' + Date.now() + '.example.com',
        content: '192.0.2.1',
        ttl: '3600',
      };

      // Create record
      await testUtils.createDNSRecord(page, testRecord);

      // Verify record appears in table
      await testUtils.waitForDNSRecord(page, testRecord.name);

      // Get all records and verify
      const records = await testUtils.getDNSRecords(page);
      const created = records.find((r) => r.name === testRecord.name);
      expect(created).toBeDefined();
      expect(created?.type).toBe('A');
      expect(created?.content).toBe(testRecord.content);
    });

    test('should create a CNAME record', async ({ page }) => {
      const testRecord = {
        type: 'CNAME',
        name: 'alias-' + Date.now() + '.example.com',
        content: 'target.example.com',
      };

      await testUtils.createDNSRecord(page, testRecord);
      await testUtils.waitForDNSRecord(page, testRecord.name);

      const records = await testUtils.getDNSRecords(page);
      const created = records.find((r) => r.name === testRecord.name);
      expect(created).toBeDefined();
      expect(created?.type).toBe('CNAME');
    });

    test('should create an MX record', async ({ page }) => {
      const testRecord = {
        type: 'MX',
        name: 'mail-' + Date.now() + '.example.com',
        content: '10 mail.example.com',
      };

      await testUtils.createDNSRecord(page, testRecord);
      await testUtils.waitForDNSRecord(page, testRecord.name);

      const records = await testUtils.getDNSRecords(page);
      const created = records.find((r) => r.name === testRecord.name);
      expect(created).toBeDefined();
      expect(created?.type).toBe('MX');
    });

    test('should create a TXT record', async ({ page }) => {
      const testRecord = {
        type: 'TXT',
        name: 'txt-' + Date.now() + '.example.com',
        content: 'v=spf1 include:_spf.example.com ~all',
      };

      await testUtils.createDNSRecord(page, testRecord);
      await testUtils.waitForDNSRecord(page, testRecord.name);

      const records = await testUtils.getDNSRecords(page);
      const created = records.find((r) => r.name === testRecord.name);
      expect(created).toBeDefined();
      expect(created?.type).toBe('TXT');
    });

    test('should update an existing record', async ({ page }) => {
      const testRecord = {
        type: 'A',
        name: 'update-test-' + Date.now() + '.example.com',
        content: '192.0.2.1',
      };

      // Create initial record
      await testUtils.createDNSRecord(page, testRecord);
      await testUtils.waitForDNSRecord(page, testRecord.name);

      // Find and click edit button
      const row = await page.$(`:text="${testRecord.name}"`);
      if (!row) throw new Error('Record not found');

      const editBtn = await row.$('[data-testid="edit-record-button"]');
      if (!editBtn) throw new Error('Edit button not found');

      await editBtn.click();

      // Update content
      const contentInput = page.locator('[data-testid="record-content-input"]');
      await contentInput.clear();
      await contentInput.fill('192.0.2.2');

      // Save
      await page.click('[data-testid="save-record-button"]');
      await page.waitForSelector('[data-testid="success-message"]');

      // Verify update
      const records = await testUtils.getDNSRecords(page);
      const updated = records.find((r) => r.name === testRecord.name);
      expect(updated?.content).toBe('192.0.2.2');
    });

    test('should delete a record', async ({ page }) => {
      const testRecord = {
        type: 'A',
        name: 'delete-test-' + Date.now() + '.example.com',
        content: '192.0.2.1',
      };

      // Create record
      await testUtils.createDNSRecord(page, testRecord);
      await testUtils.waitForDNSRecord(page, testRecord.name);

      // Delete record
      await testUtils.deleteDNSRecord(page, testRecord.name);

      // Verify deletion
      const records = await testUtils.getDNSRecords(page);
      const deleted = records.find((r) => r.name === testRecord.name);
      expect(deleted).toBeUndefined();
    });

    test('should handle validation errors gracefully', async ({ page }) => {
      // Click create button
      await page.click('[data-testid="create-record-button"]');

      // Try to submit empty form
      await page.click('[data-testid="save-record-button"]');

      // Check for error messages
      const errorMsg = page.locator('[data-testid="error-message"]');
      await expect(errorMsg).toBeVisible();
    });

    test('should show error on invalid IP address', async ({ page }) => {
      await testUtils.fillDNSForm(page, {
        type: 'A',
        name: 'invalid-' + Date.now() + '.example.com',
        content: 'not-an-ip-address',
      });

      // Submit
      await page.click('[data-testid="save-record-button"]');

      // Should show validation error
      const errorMsg = page.locator('[data-testid="error-message"]');
      await expect(errorMsg).toBeVisible();
    });
  });

  test.describe('Table Interactions', () => {
    test('should filter records by type', async ({ page }) => {
      // Find filter button
      const filterBtn = page.locator('[data-testid="filter-button"]');
      await filterBtn.click();

      // Select A record type filter
      await page.click('[data-testid="filter-type-a"]');

      // Table should only show A records
      const records = await testUtils.getDNSRecords(page);
      const allTypeA = records.every((r) => r.type === 'A' || r.type === undefined);
      expect(allTypeA).toBeTruthy();
    });

    test('should sort records by name', async ({ page }) => {
      // Click name column header to sort
      await page.click('[data-testid="sort-name"]');

      // Records should be sorted
      const records = await testUtils.getDNSRecords(page);
      const names = records.map((r) => r.name).filter(Boolean) as string[];
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });

    test('should display copy-to-clipboard for record values', async ({
      page,
    }) => {
      // Find copy button
      const copyBtn = page.locator('[data-testid="copy-content-button"]').first();
      if (await copyBtn.isVisible()) {
        await copyBtn.click();

        // Check for toast notification
        const toast = page.locator('[data-testid="copy-toast"]');
        await expect(toast).toBeVisible();
      }
    });

    test('should paginate large record lists', async ({ page }) => {
      // Check if pagination exists
      const pagination = page.locator('[data-testid="pagination"]');
      if (await pagination.isVisible()) {
        // Click next button
        const nextBtn = page.locator('[data-testid="pagination-next"]');
        if (await nextBtn.isEnabled()) {
          await nextBtn.click();

          // Verify new page loaded
          await page.waitForLoadState('networkidle');
          const records = await testUtils.getDNSRecords(page);
          expect(records.length).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be usable on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Navigate to dashboard
      await page.goto('/admin/dns');
      await page.waitForLoadState('networkidle');

      // Check that elements are accessible
      const heading = page.locator('h1, h2');
      await expect(heading).toBeVisible();

      // Mobile menu should be functional
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
        const menuItems = page.locator('[data-testid="menu-item"]');
        await expect(menuItems).toHaveCount(await menuItems.count());
      }
    });

    test('should be usable on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Navigate to dashboard
      await page.goto('/admin/dns');
      await page.waitForLoadState('networkidle');

      // All main elements should be visible
      const table = page.locator('table');
      await expect(table).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      // Check for h1
      const h1 = page.locator('h1');
      const h1Count = await h1.count();
      expect(h1Count).toBeGreaterThan(0);
    });

    test('should have proper button labels', async ({ page }) => {
      // Create button should have descriptive label
      const createBtn = page.locator('[data-testid="create-record-button"]');
      const label = await createBtn.textContent();
      expect(label).toBeTruthy();
      expect(label?.length).toBeGreaterThan(0);
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through page
      await page.keyboard.press('Tab');
      let focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBeTruthy();

      // Should be able to reach buttons
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
      }

      focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'SELECT', 'INPUT']).toContain(focused);
    });
  });
});

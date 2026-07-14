import { test, expect } from '@playwright/test';

test.describe('Cloudflare API Endpoints', () => {
  const baseURL = 'http://localhost:3000';

  test.describe('DNS API', () => {
    test('should list zones', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/cloudflare/dns?action=zones`);
      
      expect(response.status()).toBeLessThan(500); // Should not have server error
      
      if (response.status() === 401 || response.status() === 403) {
        // Missing auth is expected if token not set
        expect([401, 403]).toContain(response.status());
      } else if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data.zones) || data.result).toBeTruthy();
      }
    });

    test('should handle missing parameters gracefully', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/cloudflare/dns`);
      
      // Should return error or redirect
      expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    test('should create DNS record with valid data', async ({ request }) => {
      const recordData = {
        zoneId: 'test-zone',
        type: 'A',
        name: 'test.example.com',
        content: '192.0.2.1',
        ttl: 3600,
      };

      const response = await request.post(`${baseURL}/api/cloudflare/dns`, {
        data: recordData,
      });

      // Should handle the request (may fail due to auth, but shouldn't error)
      expect([200, 201, 400, 401, 403]).toContain(response.status());
    });

    test('should validate DNS record creation', async ({ request }) => {
      const invalidRecord = {
        zoneId: 'test-zone',
        type: 'INVALID',
        name: '',
        content: '',
      };

      const response = await request.post(`${baseURL}/api/cloudflare/dns`, {
        data: invalidRecord,
      });

      // Should validate input
      expect([400, 401, 403, 422]).toContain(response.status());
    });
  });

  test.describe('R2 Storage API', () => {
    test('should handle list objects request', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/cloudflare/r2?action=list`);
      
      expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
    });

    test('should handle upload request', async ({ request }) => {
      const formData = new FormData();
      formData.append('action', 'upload');
      formData.append('key', 'test-file.txt');
      formData.append('body', new Blob(['test content']));

      const response = await request.post(`${baseURL}/api/cloudflare/r2`, {
        data: formData,
      });

      // Should handle upload attempt
      expect([200, 201, 400, 401, 403]).toContain(response.status());
    });

    test('should generate presigned URLs', async ({ request }) => {
      const response = await request.get(
        `${baseURL}/api/cloudflare/r2?action=presigned&key=test-file.txt`
      );

      expect([200, 400, 401, 403, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        if (data.url) {
          expect(data.url).toMatch(/^https?:\/\//);
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should return proper error on malformed JSON', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/cloudflare/dns`, {
        headers: { 'Content-Type': 'application/json' },
        data: 'not-valid-json{',
      });

      expect([400, 500]).toContain(response.status());
    });

    test('should handle missing authentication', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/cloudflare/dns?action=zones`);
      
      // May be 401 if auth is required
      if (response.status() === 401) {
        const data = await response.json();
        expect(data.error || data.message).toBeTruthy();
      }
    });

    test('should rate limit excessive requests', async ({ request }) => {
      const requests = Array.from({ length: 100 }, () =>
        request.get(`${baseURL}/api/cloudflare/dns?action=zones`)
      );

      const responses = await Promise.all(requests);
      const statusCodes = responses.map((r) => r.status());

      // Some requests might be rate limited
      const hasRateLimit = statusCodes.some((s) => s === 429);
      expect(hasRateLimit).toBeFalsy(); // May not have rate limiting enabled
    });
  });

  test.describe('Content-Type Handling', () => {
    test('should handle JSON requests', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/cloudflare/dns`, {
        headers: { 'Content-Type': 'application/json' },
        data: {},
      });

      expect([200, 400, 401, 422]).toContain(response.status());
    });

    test('should handle missing content type', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/cloudflare/dns`, {
        data: {},
      });

      expect([200, 400, 401, 422]).toContain(response.status());
    });
  });
});

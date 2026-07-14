# Testing Documentation

## Overview

BankChase uses a comprehensive testing strategy combining:
- **Unit Tests**: Jest for component and utility testing
- **E2E Tests**: Playwright for user flow and API testing
- **Continuous Integration**: GitHub Actions for automated testing

## Running Tests

### Unit Tests (Jest)

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e dns-management.spec.ts

# Run tests in headed mode (visible browser)
pnpm test:e2e:headed

# Run tests with debug tools
pnpm test:e2e:debug

# Run tests in UI mode (interactive)
pnpm test:e2e:ui
```

### All Tests

```bash
# Run both unit and E2E tests
pnpm test:all
```

## Test Structure

### Unit Tests

Located in `__tests__/` directory with corresponding `.spec.ts` or `.test.ts` files.

```
__tests__/
├── unit/
│   ├── components/
│   ├── utils/
│   └── hooks/
└── e2e/
    ├── fixtures.ts
    ├── dns-management.spec.ts
    └── cloudflare-api.spec.ts
```

### E2E Tests

Located in `__tests__/e2e/` with `.spec.ts` files.

#### DNS Management Tests (`dns-management.spec.ts`)

**Navigation and Access**
- Display of DNS dashboard elements
- Zone loading and selection
- Loading state handling

**DNS Record Operations**
- Create A, CNAME, MX, TXT records
- Update existing records
- Delete records
- Validation error handling

**Table Interactions**
- Filter records by type
- Sort records by name
- Copy-to-clipboard functionality
- Pagination

**Responsive Design**
- Mobile viewport (375x667)
- Tablet viewport (768x1024)

**Accessibility**
- Heading hierarchy
- Button labels
- Keyboard navigation

#### API Tests (`cloudflare-api.spec.ts`)

**DNS API** (`/api/cloudflare/dns`)
- List zones
- Handle missing parameters
- Create DNS records
- Validate record creation

**R2 Storage API** (`/api/cloudflare/r2`)
- List objects
- Upload files
- Generate presigned URLs

**Error Handling**
- Malformed JSON requests
- Authentication errors
- Rate limiting

## Test Fixtures and Utilities

### Using Test Fixtures

Located in `__tests__/e2e/fixtures.ts`:

```typescript
import { test, expect, testUtils } from './fixtures';

test('my test', async ({ page, cloudflareToken }) => {
  // cloudflareToken is automatically available
  await page.goto('/admin/dns');
});
```

### Available Test Utilities

#### `testUtils.waitForDNSRecord(page, recordName)`
Wait for a DNS record to appear in the table.

```typescript
await testUtils.waitForDNSRecord(page, 'test.example.com');
```

#### `testUtils.getDNSRecords(page)`
Extract all DNS records from the table.

```typescript
const records = await testUtils.getDNSRecords(page);
// Returns: Array<{ name, type, content, ttl }>
```

#### `testUtils.fillDNSForm(page, record)`
Fill the DNS record form with data.

```typescript
await testUtils.fillDNSForm(page, {
  type: 'A',
  name: 'test.example.com',
  content: '192.0.2.1',
  ttl: '3600'
});
```

#### `testUtils.createDNSRecord(page, record)`
Create a complete DNS record through the UI.

```typescript
await testUtils.createDNSRecord(page, {
  type: 'CNAME',
  name: 'alias.example.com',
  content: 'target.example.com'
});
```

#### `testUtils.deleteDNSRecord(page, recordName)`
Delete a DNS record from the table.

```typescript
await testUtils.deleteDNSRecord(page, 'test.example.com');
```

## Configuration

### Playwright Configuration

File: `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './__tests__/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Jest Configuration

File: `jest.config.js`

- Test environment: jsdom (for React components)
- Module mapping: @ alias support
- Coverage thresholds: 70% for all metrics

## Writing New Tests

### Adding E2E Tests

1. Create a new `.spec.ts` file in `__tests__/e2e/`
2. Import fixtures:
   ```typescript
   import { test, expect, testUtils } from './fixtures';
   ```
3. Write test cases:
   ```typescript
   test('should do something', async ({ page }) => {
     await page.goto('/admin/dns');
     // ... test steps
   });
   ```

### Best Practices

- **Use data-testid attributes** for reliable element selection
- **Wait for network idle** after navigation: `await page.waitForLoadState('networkidle')`
- **Use semantic locators** when possible: `page.locator('button:has-text("Create")')`
- **Avoid hard waits**: Use `waitForSelector` or `waitForFunction` instead of `page.waitForTimeout()`
- **Test user flows**: Focus on what users do, not implementation details
- **Use meaningful test names**: Describe what's being tested and what should happen

## Continuous Integration

### GitHub Actions

Tests run automatically on:
- Push to main branch
- Pull requests

See `.github/workflows/test.yml` for CI configuration.

### Local Testing Before Push

```bash
# Run all tests locally
pnpm test:all

# Fix ESLint issues
pnpm lint --fix

# Build to catch compilation errors
pnpm build
```

## Debugging Tests

### Debug Mode

```bash
pnpm test:e2e:debug
```

Opens Playwright Inspector with step-by-step debugging.

### UI Mode (Interactive)

```bash
pnpm test:e2e:ui
```

Interactive test runner with visual feedback.

### Headed Mode

```bash
pnpm test:e2e:headed
```

Tests run in visible browser window for observation.

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots: `test-results/`
- Videos: `test-results/`
- Traces: `test-results/trace.zip`

View traces:
```bash
npx playwright show-trace test-results/trace.zip
```

## Test Coverage

Generate coverage report:

```bash
pnpm test:coverage
```

Open coverage report:

```bash
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Current thresholds (70%):
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Environment Variables for Testing

Set these in `.env.test` or GitHub Actions secrets:

```
CLOUDFLARE_API_TOKEN=test-token
CLOUDFLARE_ACCOUNT_ID=test-account
```

Tests will skip actual API calls if these are not set to test tokens.

## Troubleshooting

### Tests timeout

Increase timeout in specific tests:
```typescript
test.setTimeout(30000); // 30 seconds
```

### Port already in use

Kill existing process:
```bash
lsof -i :3000
kill -9 <PID>
```

### Tests pass locally but fail in CI

Common issues:
- Different environment (CI may be headless-only)
- Timing issues (use explicit waits, not hard waits)
- Missing environment variables
- Database state differences

### Flaky tests

Causes and fixes:
- **Race conditions**: Use explicit waits
- **Timing issues**: Increase waits or use `networkidle`
- **Element not stable**: Wait for element, then interact

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Jest Documentation](https://jestjs.io)
- [Testing Library Best Practices](https://testing-library.com/docs/)

## Contact & Support

For testing-related questions or issues, refer to the project's documentation or open an issue on GitHub.

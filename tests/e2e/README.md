# E2E Test Suite - LunchSaga

Low-maintenance, high-value automated tests for the LunchSaga MVP+ frontend using Playwright.

## Overview

This test suite provides comprehensive smoke coverage of the LunchSaga application against the mocked-data environment. Tests focus on robustness and resistance to UI changes by using role-based locators and semantic queries.

## Test Coverage

### 1. Application Smoke Suite (`smoke.spec.ts`)
- App loads with header/brand present
- LoginScreen renders with email input + CTA
- Navigation to Teams Dashboard works
- Basic routing checks

### 2. Team Dashboard Tests (`team-dashboard.spec.ts`)
- Roster tab renders list of members
- 'Up Next' indicator is visible on at least one member
- Team switcher dropdown opens and closes
- Holiday mode toggle presence
- Member card interactivity

### 3. Voting Flow Tests (`voting.spec.ts`)
- Vote screen renders with member cards
- Clicking vote buttons updates the UI state
- Back navigation works
- Empty/holiday state handling

### 4. Leaderboard Screen Tests (`leaderboard.spec.ts`)
- Leaderboard loads mock data and sorts correctly
- Badges or icons render
- Member profile navigation
- Back navigation

### 5. Profile & Badges Tests (`profile.spec.ts`)
- Profile screen loads mock user
- Badge list renders
- Badge tooltip or label appears on hover or click
- Stats and metrics display

### 6. Weekly Summary Screen Tests (`weekly-summary.spec.ts`)
- Mock summary loads
- Key stats (turns, win counts) render
- Historical entries display

### 7. Settings / Holiday Mode Tests (`settings.spec.ts`)
- Toggle switch renders and can be interacted with
- Holiday mode banner appears on Team Dashboard
- Settings persist across navigation

### 8. Accessibility Smoke Tests (`accessibility.spec.ts`)
- Axe-core accessibility audit (basic)
- ARIA role checks for major components
- Keyboard navigation
- Semantic HTML usage
- Form label associations

### 9. Routing Robustness Tests (`routing.spec.ts`)
- Direct navigation to screen URLs loads expected UI
- Invalid routes handle gracefully
- Browser back/forward buttons work correctly
- Deep linking support

## Prerequisites

- Node.js 20+
- npm or yarn

## Installation

Dependencies are already included in the project. If you need to reinstall:

```bash
npm install
```

Install Playwright browsers:

```bash
npx playwright install chromium
```

## Running Tests

### Run all tests (headless)

```bash
npx playwright test
```

### Run tests in headed mode (see browser)

```bash
npx playwright test --headed
```

### Run specific test file

```bash
npx playwright test tests/e2e/smoke.spec.ts
```

### Run tests in UI mode (interactive)

```bash
npx playwright test --ui
```

### Run tests in debug mode

```bash
npx playwright test --debug
```

### Run tests with specific browser

```bash
npx playwright test --project=chromium
```

## View Test Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Configuration

Test configuration is in `playwright.config.ts`. Key settings:

- **Base URL**: `http://localhost:5000` (local Vite dev server)
  - Note: Port 5000 is used instead of the default 5173 to avoid conflicts with Spark
- **Timeout**: Default test timeout
- **Retries**: 2 retries on CI, 0 locally
- **Workers**: Single worker on CI, parallel locally
- **Reporter**: HTML locally, GitHub Actions on CI

## Writing New Tests

### Best Practices

1. **Use role-based locators**: Prefer `page.getByRole()`, `page.getByLabel()`, `page.getByText()`
2. **Avoid brittle selectors**: Don't use deep CSS selectors or class names
3. **Keep tests independent**: Each test should be runnable in isolation
4. **Use meaningful assertions**: Make it clear what's being tested
5. **Handle timeouts gracefully**: Use `.catch(() => false)` for optional elements

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Common setup
    await page.goto('/');
  });

  test('should do something specific', async ({ page }) => {
    // Arrange
    const button = page.getByRole('button', { name: /submit/i });
    
    // Act
    await button.click();
    
    // Assert
    await expect(page).toHaveURL(/success/);
  });
});
```

### Helper Functions

Common test utilities are in `tests/e2e/helpers.ts`:

- `quickLogin(page, email?)`: Performs login flow
- `selectFirstTeam(page)`: Selects first team from list
- `waitForPageIdle(page)`: Waits for network and animations
- `closeToasts(page)`: Closes notification toasts

## CI/CD Integration

Tests run automatically on:
- Push to `main` branch
- Pull requests (opened, synchronized, reopened)

See `.github/workflows/e2e-tests.yml` for CI configuration.

## Troubleshooting

### Tests fail with "Target closed"
- Increase timeout in test or config
- Check if app crashed (look at trace)

### Element not found errors
- Use `--headed` mode to see what's happening
- Check if selector is too specific
- Verify element exists in current app state

### Tests are flaky
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Increase timeout for specific actions
- Check for race conditions

### Dev server doesn't start
- Make sure port 5173 is available
- Check `npm run dev` works manually
- Verify `vite.config.ts` is correct

## Mock Data Environment

These tests run against the mocked data environment defined in `src/mocks/`. No real backend is required. The app uses:

- Mock users, teams, and members
- Mock voting periods and history
- Mock badges and achievements

## Maintenance

This test suite is designed to be low-maintenance:

- Tests use semantic queries that survive UI refactoring
- No screenshot comparisons (brittle)
- Graceful handling of missing elements
- Focused on high-value user journeys

When updating:
1. Only update tests when feature behavior changes
2. Keep selectors semantic and resilient
3. Add new tests for new features
4. Remove tests for removed features

## Support

For issues or questions:
- Check Playwright documentation: https://playwright.dev
- Review test output and traces
- Use `--debug` mode for step-through debugging

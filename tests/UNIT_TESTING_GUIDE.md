# React Unit Tests - High Value, Low Maintenance

## Overview

This document explains the unit testing strategy for the LunchSaga application, focusing on high-value, low-maintenance tests.

## Current Test Coverage

### ✅ Fully Tested (100% Coverage)

1. **Utility Functions** (`src/lib/`)
   - `auth.ts` - Magic link authentication logic
   - `helpers.ts` - Business logic (rotation, scoring, badges)
   - `utils.ts` - Utility functions (classNames)
   - **Tests:** `tests/unit/lib-helpers.spec.ts`, `tests/unit/auth.spec.ts`, `tests/unit/utils.spec.ts`

2. **Navigation** (`src/utils/navigation.ts`)
   - Route helpers and navigation utilities
   - **Tests:** `tests/unit/navigation.spec.ts`

3. **Custom Hooks** (`src/hooks/`)
   - `use-mobile.ts` - Responsive breakpoint detection hook
   - **Tests:** `tests/unit/hooks/use-mobile.spec.ts`

### Test Statistics

- **Total Test Files:** 5
- **Total Tests:** 48
- **Pass Rate:** 100%
- **Coverage on Tested Modules:** 100%

## Testing Philosophy

### High Value Tests

Tests focus on:

1. **Business Logic**: Functions that implement core application rules
   - Rotation algorithms
   - Score calculations
   - Badge awards
   - Authentication flow

2. **Reusable Utilities**: Functions used across multiple components
   - Navigation helpers
   - Class name utilities
   - ID generation

3. **Custom Hooks**: React hooks with testable logic
   - Responsive behavior
   - Side effects management

### Low Maintenance Tests

To keep tests maintainable:

1. **No Over-Mocking**: Tests use real implementations where possible
2. **Test Behavior, Not Implementation**: Tests verify outcomes, not internal details
3. **Simple Setup**: Minimal boilerplate and configuration
4. **Clear Assertions**: Tests are easy to understand and debug

## What We Don't Test (And Why)

### React Components

**Reason**: The current build setup uses `@vitejs/plugin-react-swc` which requires React imports or pragma comments in component files. Since the project uses React 17+ automatic JSX transform, components don't have explicit React imports. Adding them would violate the "minimal changes" principle.

**Alternative**: End-to-end tests (Playwright) provide comprehensive coverage of component behavior and user interactions without requiring changes to source code.

### UI-Heavy Code

**Reason**: Components like `use-confetti.ts` manipulate DOM directly and are better tested through visual/integration tests rather than unit tests.

**Alternative**: Manual testing and E2E tests provide better value for these components.

## Running Tests

```bash
# Run all unit tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test tests/unit/hooks/use-mobile.spec.ts
```

## Test Structure

Tests follow a consistent pattern:

```typescript
describe('Feature Name', () => {
  // Setup
  beforeEach(() => {
    // Reset state, create mocks
  });

  // Group related tests
  describe('specific behavior', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## Adding New Tests

When adding new testable code:

1. **Utility Functions**: Add tests alongside existing lib tests
2. **Custom Hooks**: Add tests in `tests/unit/hooks/`
3. **Business Logic**: Extract to `src/lib/` and add tests

### Example: Testing a New Utility Function

```typescript
// src/lib/helpers.ts
export function calculateDiscount(price: number, percent: number): number {
  return price * (1 - percent / 100);
}

// tests/unit/lib-helpers.spec.ts
describe('calculateDiscount', () => {
  it('applies discount correctly', () => {
    expect(calculateDiscount(100, 10)).toBe(90);
  });

  it('handles zero discount', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });
});
```

## Future Improvements

### React Component Testing

If React component unit tests become necessary:

1. Configure SWC to skip preamble checking, OR
2. Use a different build plugin for tests, OR  
3. Add minimal pragma comments to component files

**Recommendation**: Continue relying on E2E tests for component behavior until there's a specific need for component unit tests that E2E tests don't cover.

### Additional Coverage Areas

Consider adding tests for:

- Form validation logic (if extracted from components)
- Data transformation functions
- Complex state management logic (if using Redux/Zustand)

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI tools
- Terminal output shows summary

## Continuous Integration

Tests run automatically on:

- Pull requests
- Main branch commits
- Pre-merge checks

Coverage thresholds are configured in `vite.config.ts`:
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

**Note**: These thresholds apply only to tested files. Components without tests are excluded from coverage requirements.

## Best Practices

1. **Keep Tests Simple**: Each test should verify one specific behavior
2. **Use Descriptive Names**: Test names should explain what's being tested
3. **Avoid Test Interdependence**: Tests should run independently
4. **Mock Sparingly**: Only mock external dependencies, not internal logic
5. **Test Edge Cases**: Include boundary conditions and error cases
6. **Keep Tests Fast**: Unit tests should run in milliseconds

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When adding new features:

1. Write tests for pure functions and business logic
2. Keep tests in the appropriate directory
3. Follow the existing test patterns
4. Ensure all tests pass before submitting PR
5. Maintain or improve coverage on new code

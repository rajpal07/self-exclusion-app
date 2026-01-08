# Testing Guide

## Overview

This document describes how to run and write tests for the Self-Exclusion Application. The test suite includes unit tests, integration tests, security tests, and API endpoint tests.

## Test Stack

- **Framework**: Jest
- **React Testing**: React Testing Library
- **Environment**: jsdom (browser simulation)
- **Coverage**: Istanbul (built into Jest)

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Security tests only
npm run test:security
```

### Watch Mode (for development)

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory.

---

## Test Structure

```
tests/
├── setup.ts                          # Test environment setup
├── unit/
│   └── ocr.test.ts                   # OCR utility tests
├── integration/
│   ├── auth.test.ts                  # Authentication tests
│   └── patron-management.test.ts     # Patron CRUD tests
├── security/
│   └── image-handling.test.ts        # Security & privacy tests
└── api/
    └── endpoints.test.ts             # API route tests
```

---

## Test Coverage

### Current Coverage Goals

| Category | Target | Description |
|----------|--------|-------------|
| Statements | 50%+ | Individual code statements |
| Branches | 50%+ | Conditional branches (if/else) |
| Functions | 50%+ | Function definitions |
| Lines | 50%+ | Lines of code |

### View Coverage Report

After running `npm run test:coverage`:

```bash
# Open HTML report
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html # Windows
xdg-open coverage/lcov-report/index.html # Linux
```

---

## Writing Tests

### Unit Test Example

```typescript
// tests/unit/example.test.ts
import { myFunction } from '@/utils/myFunction';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('');
    expect(myFunction(null)).toBeNull();
  });
});
```

### Integration Test Example

```typescript
// tests/integration/example.test.ts
import { createClient } from '@/utils/supabase/client';

jest.mock('@/utils/supabase/client');

describe('Feature Integration', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn(),
      })),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should perform operation', async () => {
    // Test implementation
  });
});
```

### Component Test Example

```typescript
// tests/components/example.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

---

## Test Categories

### 1. Unit Tests (`tests/unit/`)

**Purpose**: Test individual functions and utilities in isolation

**Coverage**:
- ✅ OCR utility functions
- ✅ Age calculation
- ✅ Data validation
- ✅ Error handling

**Example**:
```typescript
// Test age calculation
it('should calculate age correctly', () => {
  const dob = '1990-01-01';
  const age = calculateAge(dob);
  expect(age).toBeGreaterThanOrEqual(33);
});
```

### 2. Integration Tests (`tests/integration/`)

**Purpose**: Test feature workflows and component interactions

**Coverage**:
- ✅ Authentication flow (login/signup)
- ✅ Patron management (add/search)
- ✅ Audit logging
- ✅ Database operations

**Example**:
```typescript
// Test patron search
it('should find patron by name and DOB', async () => {
  const result = await searchPatron('John Doe', '1990-01-01');
  expect(result).toBeDefined();
  expect(result.name).toBe('John Doe');
});
```

### 3. Security Tests (`tests/security/`)

**Purpose**: Verify security and privacy measures

**Coverage**:
- ✅ No image storage verification
- ✅ Data sanitization
- ✅ API key security
- ✅ HTTPS transmission
- ✅ Memory cleanup

**Example**:
```typescript
// Verify no localStorage usage
it('should not store images in localStorage', () => {
  // Simulate image capture
  expect(localStorage.getItem('capturedImage')).toBeNull();
});
```

### 4. API Tests (`tests/api/`)

**Purpose**: Test API endpoints and error handling

**Coverage**:
- ✅ OCR endpoint validation
- ✅ Input validation
- ✅ Error responses
- ✅ Response format

**Example**:
```typescript
// Test OCR endpoint
it('should accept valid image data', async () => {
  const response = await fetch('/api/ocr', {
    method: 'POST',
    body: JSON.stringify({ image: 'data:image/png;base64,...' }),
  });
  expect(response.ok).toBe(true);
});
```

---

## Manual Testing Procedures

### 1. ID Scanning Flow

**Steps**:
1. Navigate to dashboard
2. Click "Scan ID Card" button
3. Allow camera access
4. Align ID card within frame
5. Capture image
6. Verify extracted data appears
7. Confirm or retake

**Verify**:
- ✅ Camera activates
- ✅ Image captured correctly
- ✅ OCR extracts name, DOB, ID number
- ✅ Age verification works
- ✅ No images in browser storage (check DevTools)

### 2. Patron Search

**Steps**:
1. Enter name and DOB
2. Click "Check" button
3. Verify result displayed

**Verify**:
- ✅ Case-insensitive search
- ✅ Correct match found
- ✅ "Not found" message for non-existent patron
- ✅ Audit log created

### 3. Add Patron

**Steps**:
1. Fill in patron details
2. Click "Add Patron"
3. Verify success message

**Verify**:
- ✅ Required field validation
- ✅ Date format validation
- ✅ Duplicate ID prevention
- ✅ Patron appears in list
- ✅ Audit log created

### 4. Authentication

**Steps**:
1. Navigate to `/login`
2. Sign up with new email
3. Log in with credentials
4. Verify dashboard access

**Verify**:
- ✅ Signup creates account
- ✅ Login redirects to dashboard
- ✅ Unauthenticated users redirected to login
- ✅ Logout works correctly

---

## Browser Compatibility Testing

### Supported Browsers

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Camera API Support

Test camera functionality on:
- Desktop (Chrome, Firefox, Edge)
- Mobile (iOS Safari, Chrome Android)

**Note**: Camera requires HTTPS in production

---

## Performance Testing

### Metrics to Monitor

1. **OCR Processing Time**
   - Target: < 5 seconds
   - Measure: Time from capture to result display

2. **Database Query Time**
   - Target: < 500ms
   - Measure: Patron search response time

3. **Page Load Time**
   - Target: < 2 seconds
   - Measure: Time to interactive

### Tools

- Chrome DevTools Performance tab
- Lighthouse audit
- Network tab for API calls

---

## Continuous Integration (CI)

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Debugging Tests

### Enable Verbose Output

```bash
npm test -- --verbose
```

### Run Single Test File

```bash
npm test -- tests/unit/ocr.test.ts
```

### Run Single Test Case

```bash
npm test -- -t "should calculate age correctly"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

---

## Common Testing Patterns

### Mocking Supabase

```typescript
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn(),
    })),
  })),
}));
```

### Mocking fetch

```typescript
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'mock' }),
} as Response);
```

### Testing Async Functions

```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Error Cases

```typescript
it('should handle errors', async () => {
  mockFunction.mockRejectedValueOnce(new Error('Test error'));
  
  await expect(myFunction()).rejects.toThrow('Test error');
});
```

---

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Avoid testing internal implementation details

2. **Keep Tests Independent**
   - Each test should run in isolation
   - Use `beforeEach` to reset state

3. **Use Descriptive Names**
   - Test names should describe expected behavior
   - Use "should" statements

4. **Test Edge Cases**
   - Empty inputs
   - Null/undefined values
   - Boundary conditions

5. **Mock External Dependencies**
   - Database calls
   - API requests
   - Third-party services

6. **Maintain Test Coverage**
   - Aim for 50%+ coverage
   - Focus on critical paths

---

## Troubleshooting

### Tests Failing Locally

1. Clear Jest cache: `npm test -- --clearCache`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check Node version: `node --version` (should be 18+)

### Mock Not Working

1. Ensure mock is defined before import
2. Use `jest.mock()` at top of file
3. Check mock implementation

### Timeout Errors

```typescript
// Increase timeout for slow tests
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Conclusion

Comprehensive testing ensures the Self-Exclusion Application is reliable, secure, and maintainable. Run tests regularly during development and before deployment.

For questions or issues with tests, consult this guide or contact the development team.

# Phase 0: Foundation - Architecture & Conventions

## Overview

This phase contains foundational architecture decisions, design patterns, and conventions that apply across all implementation phases. **Read this document in full before beginning any implementation work.**

## Architecture Decision Records (ADRs)

### ADR-001: AWS SAM for Infrastructure as Code

**Decision**: Use AWS SAM (Serverless Application Model) to manage Lambda functions and API Gateway.

**Rationale**:
- SAM provides CloudFormation-based infrastructure as code
- Native Lambda and API Gateway support
- Local testing with `sam local`
- Single-command deployment workflow
- Built-in best practices for serverless applications
- Better than manual ZIP uploads or Terraform for this scale

**Consequences**:
- Requires AWS SAM CLI installation
- Learning curve for SAM template syntax (CloudFormation subset)
- Commits both code and infrastructure definitions
- Future changes to Lambda/API Gateway go through SAM template

**Alternatives Considered**:
- Serverless Framework (too heavy for 3 functions)
- AWS CDK (TypeScript/Node.js adds complexity)
- Terraform (excellent but overkill for this scope)
- Manual deployment (current state - not maintainable)

---

### ADR-002: Brownfield SAM Integration

**Decision**: SAM template references existing S3 bucket and CloudFront distribution rather than creating new resources.

**Rationale**:
- Existing S3 bucket contains live data (poems, authors, audio files)
- CloudFront distribution already serves production traffic
- Migrating data is risky and unnecessary
- SAM manages only Lambda + API Gateway (stateless compute)
- Storage layer (S3) managed separately for stability

**Implementation**:
- SAM template uses parameters for bucket name
- Lambda functions get S3_BUCKET via environment variables
- No S3 or CloudFront resources defined in template
- API Gateway endpoints reference existing API structure

---

### ADR-003: Single Environment with Multi-Environment Design

**Decision**: Deploy to single production environment initially, but design SAM template for future multi-environment support.

**Rationale**:
- User specified "start with single environment, design for multi later"
- Use SAM parameters for environment-specific values
- Resource naming includes parameter-based suffixes
- Easy to add dev/staging later without template refactoring

**Implementation Pattern**:
```yaml
Parameters:
  Environment:
    Type: String
    Default: prod
    AllowedValues: [dev, staging, prod]

Resources:
  GetAuthorFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub 'writers-almanac-get-author-${Environment}'
```

---

### ADR-004: Test-Driven Development for Coverage Improvement

**Decision**: Use coverage reports to drive test creation, targeting 85%+ coverage.

**Rationale**:
- Current coverage is ~75% (31 test files)
- Data-driven approach identifies real gaps
- Avoid writing tests for already-tested code
- Focus effort on high-impact areas
- 85% is industry standard for well-tested applications

**Process**:
1. Run `npm run test:coverage` to generate report
2. Identify files with <70% coverage
3. Prioritize by criticality (core components > utilities)
4. Write tests using existing patterns from codebase
5. Re-run coverage to verify improvement

---

### ADR-005: Transcript Data Flow Investigation Pattern

**Decision**: Follow systematic debugging approach to identify transcript loading issue.

**Steps**:
1. **Verify data source**: Check S3 daily JSON files contain `transcript` field
2. **Verify API layer**: Confirm `usePoemQuery` returns transcript in response
3. **Verify state management**: Ensure Zustand store receives and stores transcript
4. **Verify rendering**: Check Audio component receives and displays transcript
5. **Add error handling**: Log missing transcript data at each layer

**Rationale**:
- Transcript button UI works (toggles visibility)
- Content not loading suggests data pipeline issue
- Systematic approach eliminates guesswork
- Fix at root cause, not symptoms

---

## Tech Stack Decisions

### Frontend
- **React 18.2.0** - UI framework
- **TypeScript 5.9.3** - Type safety (zero `any` types allowed)
- **Vite 7.2.0** - Build tool and dev server
- **Zustand 5.0.8** - Lightweight state management
- **TanStack Query 5.90.5** - Server state caching and sync
- **Vitest 4.0.7** - Unit testing (Jest-compatible, Vite-native)
- **Playwright 1.56.1** - E2E testing

### Backend (Lambda)
- **Node.js 18.x** - Lambda runtime
- **AWS SDK v3** (@aws-sdk/client-s3) - Modern AWS SDK
- **No framework** - Vanilla Lambda handlers for minimal cold start

### Infrastructure
- **AWS SAM** - Infrastructure as Code
- **CloudFormation** - Underlying deployment mechanism
- **API Gateway (REST)** - HTTP endpoints for Lambda
- **Lambda** - Serverless compute
- **S3** - Object storage (existing)
- **CloudFront** - CDN (existing)

---

## Shared Patterns and Conventions

### File Structure Conventions

```
react-writers-almanac/
├── docs/
│   └── plans/                    # Implementation plans (you are here)
├── lambda/
│   ├── template.yaml             # SAM template (Phase 1)
│   ├── samconfig.toml           # SAM deployment config (Phase 1)
│   ├── get-author/
│   │   ├── index.js             # Lambda handler
│   │   └── package.json         # Function dependencies
│   ├── get-authors-by-letter/
│   └── search-autocomplete/
├── src/
│   ├── components/              # React components
│   ├── hooks/                   # Custom hooks
│   │   └── queries/            # TanStack Query hooks
│   ├── store/                   # Zustand store
│   │   └── slices/             # Store slices
│   ├── api/                     # API client and endpoints
│   ├── types/                   # TypeScript definitions
│   └── utils/                   # Utility functions
└── tests/
    ├── e2e/                     # Playwright E2E tests
    └── unit/                    # Unit test helpers (if needed)
```

### TypeScript Conventions

**Strict Type Safety**:
```typescript
// ✅ GOOD - Explicit types, no `any`
interface PoemData {
  transcript: string;
  author: string[];
}

function processPoem(data: PoemData): string {
  return data.transcript;
}

// ❌ BAD - Using `any` defeats TypeScript
function processPoem(data: any): any {
  return data.transcript;
}
```

**Null/Undefined Handling**:
```typescript
// ✅ GOOD - Optional chaining and nullish coalescing
const transcript = poemData?.transcript ?? '';

// ❌ BAD - Assumes data exists
const transcript = poemData.transcript;
```

---

### Testing Patterns

#### Unit Test Structure (Vitest)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  // Group related tests
  describe('when data is loading', () => {
    it('should display loading spinner', () => {
      // Arrange - Set up test data and mocks
      const mockProps = { isLoading: true };

      // Act - Render component or call function
      render(<ComponentName {...mockProps} />);

      // Assert - Verify expected behavior
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('when data is loaded', () => {
    it('should display content', () => {
      // ... test implementation
    });
  });
});
```

**Key Principles**:
- Use `describe` blocks for grouping related tests
- Use `it` for individual test cases (reads like English: "it should...")
- Follow Arrange-Act-Assert pattern
- Mock external dependencies (API calls, stores)
- Test behavior, not implementation details

#### E2E Test Structure (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page state before each test
    await page.goto('/');
  });

  test('should perform user action successfully', async ({ page }) => {
    // Act - Simulate user interaction
    await page.click('[data-testid="transcript-button"]');

    // Assert - Verify UI response
    await expect(page.locator('[data-testid="transcript-content"]')).toBeVisible();
  });
});
```

**Key Principles**:
- Test user workflows, not implementation
- Use data-testid attributes for stable selectors
- Mock API responses to avoid flakiness
- Test happy path and error states
- Keep tests independent (no shared state)

---

### Git Commit Conventions

**Conventional Commits Format**:
```
<type>(<scope>): <subject>

<body>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring (no behavior change)
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `chore`: Build process, dependencies, tooling
- `ci`: CI/CD configuration changes

**Scopes** (examples):
- `sam`: SAM template and deployment
- `lambda`: Lambda function code
- `tests`: Test files
- `api`: API client or endpoints
- `components`: React components
- `store`: Zustand store

**Examples**:
```bash
# Phase 1 commits
feat(sam): add SAM template for Lambda deployment
test(lambda): add unit tests for get-author function
chore(sam): configure samconfig.toml for production

# Phase 2 commits
test(components): add unit tests for PoemDates component
test(coverage): increase Audio component coverage to 95%

# Phase 3 commits
fix(api): ensure transcript data flows to store
test(e2e): add transcript content loading test
```

**Commit Frequency**:
- Commit after each completed task
- Commit when all verification checklists pass
- Commit before switching contexts
- Use atomic commits (one logical change per commit)

---

## Common Pitfalls and Solutions

### Pitfall 1: SAM Build Failures

**Symptom**: `sam build` fails with "Build Failed" error

**Causes**:
- Missing `package.json` in Lambda function directory
- Wrong Node.js version in template (must be nodejs18.x)
- Syntax errors in template.yaml

**Solution**:
```bash
# Validate template syntax
sam validate --lint

# Check Lambda function has package.json
ls lambda/get-author/package.json

# Build with verbose output
sam build --debug
```

---

### Pitfall 2: API Gateway CORS Errors

**Symptom**: Browser console shows CORS errors when calling API

**Cause**: Missing CORS configuration in SAM template

**Solution**: Add CORS to API Gateway in template.yaml
```yaml
Globals:
  Api:
    Cors:
      AllowOrigin: "'*'"
      AllowMethods: "'GET,OPTIONS'"
      AllowHeaders: "'Content-Type,Authorization'"
```

**Note**: Lambda handlers MUST also return CORS headers in response!

---

### Pitfall 3: Environment Variables Not Available in Lambda

**Symptom**: Lambda logs show "S3_BUCKET is undefined"

**Cause**: Environment variables not configured in SAM template

**Solution**:
```yaml
Resources:
  GetAuthorFunction:
    Type: AWS::Serverless::Function
    Properties:
      Environment:
        Variables:
          S3_BUCKET: !Ref S3BucketName  # From parameter
          AWS_REGION: !Ref AWS::Region  # Intrinsic function
```

---

### Pitfall 4: Test Coverage Not Improving

**Symptom**: Adding tests but coverage percentage doesn't increase

**Causes**:
- Testing wrong files (already have 100% coverage)
- Not testing critical paths (branches, edge cases)
- Coverage tool not configured correctly

**Solution**:
```bash
# Generate HTML coverage report
npm run test:coverage

# Open coverage/index.html in browser
# Red = untested, yellow = partial, green = tested

# Focus on:
# 1. Files with <70% coverage
# 2. Uncovered branches (if/else statements)
# 3. Error handling paths
```

---

### Pitfall 5: Transcript Still Not Loading After Fix

**Symptom**: Implemented fix but transcript still doesn't display

**Debugging Checklist**:
```typescript
// 1. Check S3 data
console.log('Poem data from API:', poemData);
console.log('Transcript in data:', poemData.transcript);

// 2. Check store update
console.log('Setting transcript:', data.transcript);

// 3. Check store state
const transcript = useAppStore(state => state.transcript);
console.log('Transcript from store:', transcript);

// 4. Check component props
console.log('Transcript in Audio component:', transcript);

// 5. Check rendering
console.log('isShowing:', isShowing);
```

**Common Causes**:
- S3 JSON file missing `transcript` field
- Transcript is empty string `""`
- Store slice not updating correctly
- Component not re-rendering when store changes
- CSS hiding content (check `display: none`)

---

## Testing Strategy Overview

### Coverage Targets

| Layer | Target | Current | Files |
|-------|--------|---------|-------|
| Components | 90%+ | ~75% | src/components/**/*.tsx |
| Hooks | 95%+ | ~80% | src/hooks/**/*.ts |
| Store | 100% | ~90% | src/store/**/*.ts |
| Utils | 100% | ~95% | src/utils/**/*.ts |
| API | 85%+ | ~70% | src/api/**/*.ts |
| Lambda | 80%+ | 0% | lambda/**/index.js |
| **Overall** | **85%+** | **~75%** | All code |

### Test Pyramid

```
     /\
    /E2E\         6 test files, 66 test cases (broad scenarios)
   /------\
  /Integration\   5 test files (component + store + API)
 /------------\
/  Unit Tests  \  25+ test files (isolated logic)
----------------
```

**Strategy**:
- **Unit tests** (80% of tests): Fast, isolated, test single functions/components
- **Integration tests** (15% of tests): Test component + hooks + store together
- **E2E tests** (5% of tests): Test complete user workflows

### When to Write Each Test Type

**Unit Test** - Write when:
- Testing pure functions (utils, helpers)
- Testing component rendering with mocked dependencies
- Testing store slices in isolation
- Testing hooks with mocked API responses

**Integration Test** - Write when:
- Testing data flow: API → Hook → Store → Component
- Testing component interactions (parent/child communication)
- Testing error propagation through layers

**E2E Test** - Write when:
- Testing critical user workflows (search, navigation, audio)
- Testing browser-specific behavior
- Testing full application stack including API

---

## SAM Template Design Patterns

### Pattern 1: Parameterized Configuration

**Use Case**: Support multiple environments (dev, staging, prod)

```yaml
Parameters:
  Environment:
    Type: String
    Default: prod
    Description: Deployment environment

  S3BucketName:
    Type: String
    Description: Existing S3 bucket for data storage

Resources:
  GetAuthorFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub 'writers-almanac-get-author-${Environment}'
      Environment:
        Variables:
          S3_BUCKET: !Ref S3BucketName
          ENVIRONMENT: !Ref Environment
```

**Benefits**:
- Single template for all environments
- Override parameters at deployment time
- No hardcoded values

---

### Pattern 2: Globals for DRY Configuration

**Use Case**: Shared settings across all Lambda functions

```yaml
Globals:
  Function:
    Runtime: nodejs18.x
    Timeout: 30
    MemorySize: 256
    Environment:
      Variables:
        NODE_ENV: production
        AWS_REGION: !Ref AWS::Region
  Api:
    Cors:
      AllowOrigin: "'*'"
      AllowMethods: "'GET,OPTIONS'"
```

**Benefits**:
- Reduce duplication in template
- Consistent configuration across functions
- Easy to update shared settings

---

### Pattern 3: Explicit IAM Policies

**Use Case**: Least-privilege access to S3 bucket

```yaml
Resources:
  GetAuthorFunction:
    Type: AWS::Serverless::Function
    Properties:
      Policies:
        - S3ReadPolicy:
            BucketName: !Ref S3BucketName
        - CloudWatchLogsFullAccess
```

**Benefits**:
- Security best practice (least privilege)
- SAM provides policy templates
- Audit trail in CloudFormation

---

### Pattern 4: API Gateway Event Integration

**Use Case**: Define HTTP endpoints for Lambda functions

```yaml
Resources:
  GetAuthorFunction:
    Type: AWS::Serverless::Function
    Properties:
      Events:
        GetAuthorApi:
          Type: Api
          Properties:
            Path: /api/author/{name}
            Method: get
            RestApiId: !Ref WritersAlmanacApi
```

**Benefits**:
- Infrastructure as code for API routes
- Automatic API Gateway creation
- Path parameters mapped to Lambda event

---

## Development Tools and Commands

### SAM CLI Commands

```bash
# Validate template syntax
sam validate --lint

# Build Lambda functions (creates .aws-sam/ directory)
sam build

# Deploy to AWS (prompts for parameters)
sam deploy --guided

# Deploy with saved config (after first deployment)
sam deploy

# Test Lambda locally (requires Docker)
sam local start-api

# Invoke specific function locally
sam local invoke GetAuthorFunction --event event.json

# View CloudFormation stack
sam list stack-outputs

# Delete deployed stack
sam delete
```

### Testing Commands

```bash
# Run all unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm test -- src/components/Audio/Audio.test.tsx

# Run E2E tests
npm run test:e2e

# Run E2E in headed mode (see browser)
npm run test:e2e -- --headed

# Open Playwright UI for debugging
npm run test:e2e:ui
```

### Coverage Analysis

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report (detailed file-by-file view)
open coverage/index.html

# Coverage output in terminal shows:
# - % Statements covered
# - % Branches covered (if/else paths)
# - % Functions covered
# - % Lines covered
```

---

## Error Handling Standards

### Lambda Error Responses

**Pattern**: Always return consistent error structure

```javascript
function errorResponse(statusCode, message, code) {
  return {
    statusCode,
    headers: getCorsHeaders(), // IMPORTANT: Include CORS
    body: JSON.stringify({
      message,        // User-friendly message
      status: statusCode,
      code,          // Machine-readable error code
      timestamp: new Date().toISOString(),
    }),
  };
}
```

**Error Codes**:
- `MISSING_PARAMETER` - 400
- `INVALID_NAME` - 400
- `AUTHOR_NOT_FOUND` - 404
- `INTERNAL_ERROR` - 500

---

### Frontend Error Handling

**Pattern**: Handle errors at query level with user-friendly messages

```typescript
const { data, error, errorMessage } = usePoemQuery(date);

if (error) {
  return <ErrorMessage message={errorMessage} />;
}
```

**TanStack Query Error Handling**:
```typescript
retry: (failureCount, error) => {
  const status = error?.response?.status;

  // Don't retry 4xx errors (client errors)
  if (status >= 400 && status < 500) {
    return false;
  }

  // Retry 5xx errors up to 3 times
  return failureCount < 3;
},
retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
```

---

## Security Considerations

### Lambda Security

1. **Environment Variables**: Never hardcode credentials
   ```javascript
   const BUCKET_NAME = process.env.S3_BUCKET; // ✅ GOOD
   const BUCKET_NAME = 'my-bucket-name';      // ❌ BAD
   ```

2. **Input Validation**: Always validate user input
   ```javascript
   if (!authorName) {
     return errorResponse(400, 'Missing author name', 'MISSING_PARAMETER');
   }
   ```

3. **IAM Policies**: Least-privilege access
   ```yaml
   Policies:
     - S3ReadPolicy:  # Only read, not write
         BucketName: !Ref S3BucketName
   ```

### Frontend Security

1. **HTML Sanitization**: Use DOMPurify for user-generated content
   ```typescript
   import DOMPurify from 'dompurify';
   const clean = DOMPurify.sanitize(unsafeHtml);
   ```

2. **XSS Prevention**: Never use `dangerouslySetInnerHTML` without sanitization
   ```typescript
   // ✅ GOOD
   <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />

   // ❌ BAD
   <div dangerouslySetInnerHTML={{ __html: html }} />
   ```

---

## Performance Optimization Patterns

### Lambda Cold Start Optimization

1. **Minimize dependencies**: Only include what you need
2. **Initialize outside handler**: S3 client initialization at module level
   ```javascript
   const s3Client = new S3Client({ region: process.env.AWS_REGION });

   exports.handler = async (event) => {
     // Handler reuses s3Client across invocations
   };
   ```

3. **Use provisioned concurrency**: For critical endpoints (Phase 1+ enhancement)

### Frontend Performance

1. **Code Splitting**: Already implemented via lazy loading
   ```typescript
   const Audio = lazy(() => import('./components/Audio/Audio'));
   ```

2. **Query Caching**: TanStack Query caches aggressively
   ```typescript
   staleTime: 1000 * 60 * 60, // 1 hour - poems are immutable
   gcTime: 1000 * 60 * 60 * 24, // 24 hours
   ```

3. **Memoization**: Use useMemo/useCallback for expensive operations

---

## Next Steps

You've completed Phase 0 foundation review. Proceed to:

- **[Phase 1: SAM Automated Deployment](./Phase-1.md)** - Create SAM template and deployment infrastructure
- **[Phase 2: Test Coverage Improvement](./Phase-2.md)** - Analyze and improve test coverage
- **[Phase 3: Transcript Content Loading Fix](./Phase-3.md)** - Debug and fix transcript data flow

Remember to reference this document throughout implementation for patterns, conventions, and solutions to common issues.

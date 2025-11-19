# Phase 1: SAM Automated Deployment Infrastructure

## Phase Goal

Transform the manual Lambda deployment process into an automated, repeatable infrastructure-as-code workflow using AWS SAM. This phase creates a SAM template that manages three Lambda functions (get-author, get-authors-by-letter, search-autocomplete) and API Gateway configuration, integrating with existing S3 and CloudFront infrastructure. Success means executing `sam deploy` once to update all Lambda functions and API routes without manual intervention.

**Success Criteria**:
- ✅ SAM template deploys all 3 Lambda functions successfully
- ✅ API Gateway routes configured correctly via SAM
- ✅ Single-command deployment workflow (`sam deploy`)
- ✅ All existing frontend functionality works unchanged
- ✅ Local testing capability with `sam local start-api`

**Estimated tokens**: ~75,000

---

## Prerequisites

### Tools Installed
- [ ] AWS SAM CLI (v1.100.0+): `sam --version`
- [ ] AWS CLI (v2.13.0+): `aws --version`
- [ ] Docker (for SAM local testing): `docker --version`
- [ ] Node.js 18.x: `node --version`

### AWS Configuration
- [ ] AWS credentials configured: `aws sts get-caller-identity`
- [ ] IAM permissions verified (see Phase 0)
- [ ] Know your existing S3 bucket name
- [ ] Know your AWS region

### Repository State
- [ ] On branch `claude/design-new-feature-01SJt8Xs8ZfG9foLfshCCGsK`
- [ ] Clean working directory: `git status`
- [ ] All tests passing: `npm test && npm run test:e2e`

### Environment Files
- [ ] `.env` file exists with required variables
- [ ] S3 bucket contains live data (don't modify)

---

## Tasks

### Task 1: Create SAM Template Foundation

**Goal**: Create the base SAM template file that defines Lambda functions and global configuration settings, following AWS SAM best practices for serverless applications.

**Files to Create**:
- `lambda/template.yaml` - SAM template defining infrastructure

**Prerequisites**:
- Read Phase 0 ADR-001, ADR-002, ADR-003
- Review existing Lambda function structure in `lambda/` directory
- Understand current Lambda configuration (runtime, memory, timeout)

**Implementation Steps**:

1. **Analyze existing Lambda functions** to understand their current configuration:
   - Read `/home/user/react-writers-almanac/lambda/get-author/index.js`
     - Note environment variables used: `process.env.S3_BUCKET`, `process.env.AWS_REGION`
     - Note handler function: `exports.handler`
     - Note runtime requirements: Node.js 18.x
   - Read `/home/user/react-writers-almanac/lambda/get-authors-by-letter/index.js`
     - Check dependencies in `package.json` (AWS SDK v3)
     - Note similar environment variables
   - Read `/home/user/react-writers-almanac/lambda/search-autocomplete/index.js`
     - Check memory/timeout needs (larger function, may need 512 MB)
     - Note caching implementation
   - Summary: All three functions use the same environment variables (`S3_BUCKET`, `AWS_REGION`), same runtime (Node.js 18.x), and AWS SDK v3 for S3 access

2. **Create SAM template structure** at `lambda/template.yaml`:
   - Start with SAM Transform declaration (`AWS::Serverless-2016-10-31`)
   - Define template description and metadata
   - Add Parameters section for configurable values (Environment, S3BucketName)
   - Add Globals section for shared Lambda configuration (Runtime, Timeout, MemorySize)
   - Add Resources section for Lambda functions and API Gateway
   - Add Outputs section for deployed resource ARNs and URLs

3. **Define the three Lambda functions** as AWS::Serverless::Function resources:
   - `GetAuthorFunction`: Handles `/api/author/{name}` endpoint
   - `GetAuthorsByLetterFunction`: Handles `/api/authors/letter/{letter}` endpoint
   - `SearchAutocompleteFunction`: Handles `/api/search/autocomplete` endpoint

4. **Configure each Lambda function** with:
   - CodeUri pointing to function directory
   - Handler set to `index.handler`
   - Runtime from Globals
   - Environment variables for S3_BUCKET and AWS_REGION
   - IAM policies for S3 read access and CloudWatch logs
   - API Gateway event triggers with correct HTTP method and path

5. **Set up API Gateway** in Globals section:
   - Enable CORS with wildcard origin (existing behavior)
   - Allow GET and OPTIONS methods
   - Set appropriate headers

6. **Add useful Outputs** to display after deployment:
   - API Gateway endpoint URL
   - Lambda function ARNs
   - Stack name

**Key Design Decisions**:
- Use Parameters for values that differ between environments
- Use Globals to DRY configuration across all functions
- Use SAM policy templates (S3ReadPolicy) instead of custom IAM policies
- Keep function names environment-specific using `!Sub` intrinsic function
- Reference existing S3 bucket (don't create new one)

**Verification Checklist**:
- [ ] Template uses `Transform: AWS::Serverless-2016-10-31`
- [ ] All three Lambda functions defined as resources
- [ ] Each function has S3_BUCKET environment variable from parameter
- [ ] IAM policies grant S3 read access to specified bucket
- [ ] API Gateway events match existing route structure
- [ ] CORS configured in Globals.Api
- [ ] Template validates: `sam validate --lint`
- [ ] No hardcoded bucket names or regions

**Testing Instructions**:
```bash
# Validate template syntax
cd lambda
sam validate --lint

# Expected output: template.yaml is a valid SAM Template

# Check for common issues
grep -i "hardcoded" template.yaml  # Should return nothing
grep "my-bucket" template.yaml     # Should return nothing
```

**Commit Message Template**:
```
feat(sam): create SAM template for Lambda and API Gateway

- Add template.yaml with 3 Lambda function definitions
- Configure API Gateway with CORS and route mappings
- Use parameters for environment-specific values
- Add IAM policies for S3 read access and logging
- Define outputs for deployed resource information
```

**Estimated tokens**: ~8,000

---

### Task 2: Configure SAM Deployment Settings

**Goal**: Create samconfig.toml to store deployment configuration, enabling `sam deploy` to work without interactive prompts.

**Files to Create**:
- `lambda/samconfig.toml` - SAM CLI deployment configuration

**Prerequisites**:
- Task 1 complete (template.yaml exists and validates)
- Know your AWS region
- Know your S3 bucket name for application data

**Implementation Steps**:

1. **Determine deployment configuration values**:
   - Choose a CloudFormation stack name (e.g., `writers-almanac-backend-prod`)
   - Identify AWS region for deployment
   - Decide on S3 bucket for SAM artifacts (can be auto-created)
   - List parameter overrides (Environment, S3BucketName)

2. **Create samconfig.toml** in `lambda/` directory:
   - Add `[default.deploy.parameters]` section
   - Configure stack name, region, and capabilities
   - Set parameter overrides for template parameters
   - Enable changesets for safe deployments
   - Configure output formatting

3. **Add helpful comments** explaining each configuration option:
   - Document why each parameter exists
   - Note which values need changing for different environments
   - Reference AWS SAM documentation for advanced options

4. **Set up artifact storage**:
   - Use `resolve_s3 = true` to auto-create artifact bucket
   - Or specify existing bucket for SAM deployment artifacts
   - Note: This is different from your application data bucket

**Configuration Guidelines**:
- Use descriptive stack names that include environment
- Enable `confirm_changeset = true` for safety (first deployment)
- Set `capabilities = "CAPABILITY_IAM"` for IAM role creation
- Use parameter overrides to inject environment-specific values

**Verification Checklist**:
- [ ] File located at `lambda/samconfig.toml`
- [ ] Stack name follows naming convention (project-component-environment)
- [ ] Region matches your AWS account setup
- [ ] S3BucketName parameter points to existing data bucket
- [ ] Capabilities includes CAPABILITY_IAM
- [ ] File syntax is valid TOML
- [ ] Comments explain configuration choices

**Testing Instructions**:
```bash
# Validate TOML syntax
cat lambda/samconfig.toml

# Check SAM can read config
cd lambda
sam deploy --dry-run

# Should show deployment plan without executing
```

**Commit Message Template**:
```
chore(sam): configure deployment settings in samconfig.toml

- Add default deployment configuration for production
- Set stack name and region parameters
- Configure S3 bucket parameter override
- Enable changeset confirmation for safety
```

**Estimated tokens**: ~4,000

---

### Task 3: Test Lambda Functions Locally with SAM

**Goal**: Verify Lambda functions work correctly using SAM local testing before deploying to AWS, catching configuration issues early.

**Files to Create**:
- `lambda/events/get-author-event.json` - Test event for get-author
- `lambda/events/get-authors-by-letter-event.json` - Test event for get-authors-by-letter
- `lambda/events/search-autocomplete-event.json` - Test event for search-autocomplete

**Prerequisites**:
- Task 1 and 2 complete (template and config exist)
- Docker running: `docker ps` (required for SAM local)
- AWS credentials configured (for S3 access)

**Implementation Steps**:

1. **Build Lambda functions** for local testing:
   - Run `sam build` to compile functions into `.aws-sam/` directory
   - Verify build succeeds for all three functions
   - Check that dependencies are installed correctly

2. **Create test event files** for each Lambda function:
   - Create `lambda/events/` directory
   - Generate API Gateway proxy event JSON for each endpoint
   - Include path parameters (e.g., `{name}` or `{letter}`)
   - Include query parameters where applicable
   - Follow API Gateway event format (see example below)

**API Gateway Proxy Event Structure Example**:
```json
{
  "httpMethod": "GET",
  "path": "/api/author/billy-collins",
  "pathParameters": {
    "name": "billy-collins"
  },
  "queryStringParameters": null,
  "headers": {
    "Accept": "application/json",
    "Content-Type": "application/json"
  },
  "body": null,
  "isBase64Encoded": false
}
```

**Example event files to create**:

`lambda/events/get-author-event.json`:
```json
{
  "httpMethod": "GET",
  "path": "/api/author/billy-collins",
  "pathParameters": {
    "name": "billy-collins"
  },
  "queryStringParameters": null,
  "headers": {
    "Accept": "application/json"
  },
  "body": null,
  "isBase64Encoded": false
}
```

`lambda/events/get-authors-by-letter-event.json`:
```json
{
  "httpMethod": "GET",
  "path": "/api/authors/letter/B",
  "pathParameters": {
    "letter": "B"
  },
  "queryStringParameters": null,
  "headers": {
    "Accept": "application/json"
  },
  "body": null,
  "isBase64Encoded": false
}
```

`lambda/events/search-autocomplete-event.json`:
```json
{
  "httpMethod": "GET",
  "path": "/api/search/autocomplete",
  "pathParameters": null,
  "queryStringParameters": {
    "q": "billy",
    "limit": "5"
  },
  "headers": {
    "Accept": "application/json"
  },
  "body": null,
  "isBase64Encoded": false
}
```

3. **Test individual functions** using `sam local invoke`:
   - Test GetAuthorFunction with a known author (e.g., "billy-collins")
   - Test GetAuthorsByLetterFunction with a letter (e.g., "B")
   - Test SearchAutocompleteFunction with a search query
   - Verify each returns expected response structure
   - Check logs for errors or warnings

4. **Test API Gateway locally** using `sam local start-api`:
   - Start local API server (runs on http://localhost:3000 by default)
   - Test endpoints with curl or browser
   - Verify CORS headers present in responses
   - Test OPTIONS requests for CORS preflight
   - Verify error responses for invalid inputs

5. **Validate against existing API contract**:
   - Compare local responses to production API responses
   - Ensure response structure matches frontend expectations
   - Verify error codes and messages are consistent

**Local Testing Patterns**:
```bash
# Build functions
cd lambda
sam build

# Invoke specific function
sam local invoke GetAuthorFunction --event events/get-author-event.json

# Start local API
sam local start-api

# Test with curl (in another terminal)
curl http://localhost:3000/api/author/billy-collins
curl http://localhost:3000/api/authors/letter/B
curl "http://localhost:3000/api/search/autocomplete?q=billy&limit=5"
```

**Verification Checklist**:
- [ ] `sam build` completes successfully
- [ ] All three functions build without errors
- [ ] Test events created in `lambda/events/` directory
- [ ] Each function invokes successfully with test event
- [ ] Local API starts on port 3000
- [ ] All three endpoints respond correctly
- [ ] CORS headers present in responses
- [ ] Error handling works (test invalid inputs)
- [ ] Responses match production API format
- [ ] No errors in CloudWatch-style logs

**Testing Instructions**:
```bash
# Test build
cd lambda
sam build --debug

# Test individual function
sam local invoke GetAuthorFunction \
  --event events/get-author-event.json

# Expected: 200 response with author data JSON

# Test local API
sam local start-api &
API_PID=$!

sleep 5  # Wait for API to start

# Test endpoint
curl -i http://localhost:3000/api/author/billy-collins

# Should see:
# - HTTP 200 status
# - Access-Control-Allow-Origin: * header
# - JSON response with author data

kill $API_PID  # Stop local API
```

**Commit Message Template**:
```
test(sam): add local testing events and verify functions

- Create test events for all Lambda functions
- Verify local invocation with sam local invoke
- Test API Gateway integration with sam local start-api
- Confirm CORS headers and response formats
```

**Estimated tokens**: ~10,000

---

### Task 4: Deploy to AWS Production

**Goal**: Execute the first SAM deployment to AWS, creating the CloudFormation stack and deploying all Lambda functions and API Gateway configuration.

**Files Modified**:
- None (deployment only)

**Prerequisites**:
- Task 1, 2, 3 complete and verified
- AWS credentials configured with deployment permissions
- Local testing passed successfully
- Existing S3 bucket accessible
- Clean git state (all changes committed)

**Implementation Steps**:

1. **Perform pre-deployment checks**:
   - Run `sam validate --lint` to ensure template is valid
   - Verify samconfig.toml has correct parameters
   - Check AWS credentials: `aws sts get-caller-identity`
   - Ensure Docker is running (required for build)
   - Note existing API Gateway endpoint URL (to verify it changes)

2. **Run guided deployment** (first time only):
   - Execute `sam deploy --guided`
   - Review prompted questions and confirm values from samconfig.toml
   - Confirm IAM role creation (required for Lambda execution)
   - Review changeset showing resources to be created
   - Type "y" to execute deployment
   - Monitor CloudFormation stack creation in terminal

3. **Wait for deployment completion**:
   - Watch CloudFormation events as stack creates resources
   - Typical deployment time: 2-5 minutes
   - Monitor for any errors or rollbacks
   - Note the stack outputs at completion

4. **Capture deployment outputs**:
   - Record new API Gateway endpoint URL from outputs
   - Save Lambda function ARNs for reference
   - Document CloudFormation stack name
   - Update `.env` file if API endpoint changed

5. **Verify CloudFormation stack** in AWS Console (optional):
   - Navigate to CloudFormation service
   - Find stack (writers-almanac-backend-prod)
   - Check Resources tab for created resources
   - Review Outputs tab for endpoint URLs
   - Check Events tab for deployment log

**Deployment Command Sequence**:
```bash
cd lambda

# Pre-flight checks
sam validate --lint
aws sts get-caller-identity

# Build before deploy
sam build

# Deploy (first time - guided)
sam deploy --guided

# Future deployments (uses saved config)
sam deploy
```

**Monitoring Deployment**:
- Watch for "CREATE_IN_PROGRESS" events
- Look for "CREATE_COMPLETE" final status
- If "ROLLBACK_COMPLETE" occurs, check error messages
- Common issues: IAM permissions, invalid parameters, timeout

**Verification Checklist**:
- [ ] Pre-deployment validation passes
- [ ] Build completes without errors
- [ ] Deployment starts successfully
- [ ] CloudFormation stack creates without rollback
- [ ] All resources show CREATE_COMPLETE status
- [ ] Stack outputs display API Gateway URL
- [ ] Lambda functions visible in AWS Console
- [ ] API Gateway shows new API with correct routes
- [ ] No deployment errors in terminal output

**Testing Instructions**:
```bash
# After deployment, test endpoints
API_URL=$(sam list stack-outputs --stack-name writers-almanac-backend-prod \
  --output json | jq -r '.[] | select(.OutputKey=="ApiUrl") | .OutputValue')

# Test each endpoint
curl "${API_URL}/api/author/billy-collins"
curl "${API_URL}/api/authors/letter/B"
curl "${API_URL}/api/search/autocomplete?q=billy&limit=5"

# Verify CORS headers
curl -I -X OPTIONS "${API_URL}/api/author/billy-collins"

# Should see Access-Control-Allow-Origin: * header
```

**Commit Message Template**:
```
chore(sam): execute initial SAM deployment to production

- Deploy CloudFormation stack with SAM
- Create Lambda functions for all three endpoints
- Configure API Gateway with CORS
- Update environment with new API endpoint
```

**Estimated tokens**: ~12,000

---

### Task 5: Update Frontend Configuration

**Goal**: Update frontend environment variables and API client configuration to use the new SAM-deployed API Gateway endpoint.

**Files to Modify**:
- `.env` - Environment variables
- `.env.example` - Example environment file (if exists)
- `README.md` - Update deployment documentation

**Prerequisites**:
- Task 4 complete (SAM deployed successfully)
- New API Gateway endpoint URL from stack outputs
- Frontend currently using old/manual API endpoint

**Implementation Steps**:

1. **Retrieve new API Gateway endpoint**:
   - Get URL from SAM stack outputs: `sam list stack-outputs`
   - Format: `https://{api-id}.execute-api.{region}.amazonaws.com/Prod`
   - Note: SAM creates "Prod" stage by default

2. **Update environment file**:
   - Open `.env` file
   - Update `VITE_API_BASE_URL` to new API Gateway URL
   - Ensure other variables remain unchanged (CDN, S3 bucket, region)
   - Verify no trailing slashes in URL

3. **Update example environment file** (if exists):
   - Update `.env.example` with new URL pattern
   - Add comments explaining how to get API URL from SAM
   - Keep sensitive values as placeholders

4. **Update deployment documentation**:
   - Update README.md Lambda deployment section
   - Document new SAM deployment process
   - Remove references to manual ZIP upload process
   - Add SAM CLI prerequisite to installation section

5. **Test frontend integration**:
   - Restart Vite dev server: `npm run dev`
   - Verify API calls use new endpoint (check Network tab)
   - Test author search functionality
   - Test autocomplete search
   - Verify no CORS errors in console

**Configuration Format**:
```bash
# .env
VITE_API_BASE_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/Prod
VITE_CDN_BASE_URL=https://your-cloudfront-distribution.cloudfront.net
VITE_S3_BUCKET=your-bucket-name
VITE_AWS_REGION=us-east-1
```

**Verification Checklist**:
- [ ] `.env` updated with new API Gateway URL
- [ ] `.env.example` updated (if exists)
- [ ] No trailing slashes in API URL
- [ ] README.md documents SAM deployment process
- [ ] Frontend dev server restarts successfully
- [ ] API calls visible in browser Network tab
- [ ] All API calls succeed (200 responses)
- [ ] No CORS errors in browser console
- [ ] Author search works correctly
- [ ] Autocomplete search works correctly

**Testing Instructions**:
```bash
# Verify environment variable loaded
npm run dev

# In browser console:
console.log(import.meta.env.VITE_API_BASE_URL)
# Should show new API Gateway URL

# Test API integration
# 1. Open app in browser
# 2. Open DevTools Network tab
# 3. Perform author search
# 4. Verify request goes to new API Gateway URL
# 5. Verify 200 response with correct data
# 6. Check for CORS headers in response
```

**README.md Update Example**:
````markdown
## Lambda Deployment

### Prerequisites
- AWS SAM CLI installed
- AWS credentials configured
- Docker running (for local testing)

### Deploy
```bash
cd lambda
sam build
sam deploy
```

### Local Testing
```bash
cd lambda
sam local start-api
# API available at http://localhost:3000
```
````

**Commit Message Template**:
```
chore(config): update frontend to use SAM-deployed API

- Update VITE_API_BASE_URL to new API Gateway endpoint
- Update README with SAM deployment instructions
- Remove manual ZIP upload documentation
- Verify frontend integration with new API
```

**Estimated tokens**: ~8,000

---

### Task 6: Verify End-to-End Integration

**Goal**: Comprehensively test the entire application with SAM-deployed backend to ensure no regressions and all functionality works correctly.

**Files to Modify**:
- None (testing only)

**Prerequisites**:
- All previous tasks complete
- Frontend configured with new API endpoint
- Dev server running or production build deployed

**Implementation Steps**:

1. **Run unit test suite**:
   - Execute `npm test` to run all Vitest unit tests
   - Verify all 31 test files pass
   - Check for any new warnings or errors
   - Ensure coverage hasn't decreased

2. **Run E2E test suite**:
   - Execute `npm run test:e2e` to run Playwright tests
   - Verify all 66 test cases pass
   - Check for flaky tests (re-run if needed)
   - Review HTML report for any failures

3. **Perform manual integration testing**:
   - Test daily poem loading with current date
   - Test date picker navigation (previous/next)
   - Test author search with autocomplete
   - Test author page loading
   - Test audio playback (if available for date)
   - Test error handling (invalid dates, missing authors)

4. **Verify API Gateway functionality**:
   - Test all three endpoints directly with curl
   - Verify response times are acceptable (<2 seconds)
   - Check CloudWatch Logs for Lambda invocations
   - Verify no errors in Lambda logs
   - Test OPTIONS requests for CORS preflight

5. **Performance testing**:
   - Check Lambda cold start times (first invocation)
   - Check warm Lambda response times (subsequent calls)
   - Verify API Gateway latency is acceptable
   - Use browser DevTools Performance tab for frontend

6. **Document any issues**:
   - Note any errors or warnings encountered
   - Document workarounds or fixes applied
   - Create follow-up tasks if needed
   - Update Phase 0 common pitfalls if applicable

**Testing Checklist**:

**Unit Tests**:
- [ ] `npm test` passes (all tests)
- [ ] No new test failures
- [ ] No new console warnings
- [ ] Coverage report generates successfully

**E2E Tests**:
- [ ] `npm run test:e2e` passes (all 66 test cases)
- [ ] Search flow tests pass
- [ ] Navigation tests pass
- [ ] Audio tests pass
- [ ] Error handling tests pass
- [ ] Responsive design tests pass

**Manual Integration**:
- [ ] Daily poem loads correctly
- [ ] Date picker works (prev/next buttons)
- [ ] Author search autocomplete works
- [ ] Author page loads with correct data
- [ ] Audio player loads (for dates after 2009-01-11)
- [ ] Transcript button toggles visibility (content loading tested in Phase 3)
- [ ] Error messages display for invalid inputs

**API Testing**:
- [ ] GET /api/author/{name} returns 200 with valid author
- [ ] GET /api/author/{name} returns 404 for invalid author
- [ ] GET /api/authors/letter/{letter} returns author list
- [ ] GET /api/search/autocomplete works with query parameter
- [ ] OPTIONS requests return CORS headers
- [ ] Response times < 2 seconds

**CloudWatch Verification**:
- [ ] Lambda functions appear in CloudWatch Logs
- [ ] No ERROR level logs for successful requests
- [ ] Cold start times < 5 seconds
- [ ] Warm invocation times < 500ms

**Verification Checklist**:
- [ ] All tests passing
- [ ] All manual tests successful
- [ ] API endpoints responding correctly
- [ ] CORS working properly
- [ ] No console errors in browser
- [ ] CloudWatch logs show successful invocations
- [ ] Performance is acceptable
- [ ] No regressions from previous deployment

**Testing Instructions**:
```bash
# Run full test suite
npm test
npm run test:e2e

# Test API endpoints directly
API_URL="https://your-api.execute-api.us-east-1.amazonaws.com/Prod"

# Test get-author
curl -i "${API_URL}/api/author/billy-collins"
# Expect: 200 OK with JSON author data

# Test get-authors-by-letter
curl -i "${API_URL}/api/authors/letter/B"
# Expect: 200 OK with array of authors

# Test search-autocomplete
curl -i "${API_URL}/api/search/autocomplete?q=billy&limit=5"
# Expect: 200 OK with search suggestions

# Test CORS
curl -i -X OPTIONS "${API_URL}/api/author/test"
# Expect: Access-Control-Allow-Origin: * header

# Check CloudWatch logs
aws logs tail /aws/lambda/writers-almanac-get-author-prod --follow
```

**Commit Message Template**:
```
test(integration): verify SAM deployment with full test suite

- Run unit tests (all passing)
- Run E2E tests (66 test cases passing)
- Verify manual integration testing
- Confirm API Gateway endpoints working
- Check CloudWatch logs for errors
- Validate performance metrics
```

**Estimated tokens**: ~15,000

---

### Task 7: Clean Up Legacy Deployment Scripts

**Goal**: Remove or update the legacy manual deployment scripts now that SAM automates the deployment process, reducing confusion and maintenance burden.

**Files to Modify**:
- `lambda/package-all.sh` - Update or remove
- `lambda/README.md` - Update deployment instructions (if exists)
- `.gitignore` - Add SAM-specific ignores

**Prerequisites**:
- Task 6 complete (SAM deployment verified working)
- All tests passing
- Confidence that SAM deployment replaces manual process

**Implementation Steps**:

1. **Decide on package-all.sh disposition**:
   - Option A: Remove entirely (SAM handles packaging)
   - Option B: Keep but update header to note it's deprecated
   - Option C: Repurpose for local development only
   - Recommendation: Option B (keep for emergency rollback capability)

2. **Update package-all.sh** (if keeping):
   - Add deprecation notice at top of file
   - Add comment: "DEPRECATED: Use SAM for deployment (see README)"
   - Keep functionality intact for emergency use
   - Update echo messages to recommend SAM

3. **Update Lambda README** (if exists):
   - Add SAM deployment section at top
   - Move manual deployment to "Legacy" section
   - Add troubleshooting section for SAM
   - Document rollback procedure if needed

4. **Update .gitignore**:
   - Add `.aws-sam/` directory (SAM build artifacts)
   - Add `samconfig.toml` secrets (if contains sensitive data)
   - Keep `lambda/dist/*.zip` (legacy artifacts)

5. **Clean up legacy artifacts**:
   - Remove `lambda/dist/*.zip` files (generated by package-all.sh)
   - Keep package.json files in each Lambda directory (SAM uses them)
   - Remove any temporary files from manual deployment

6. **Update root README**:
   - Update backend deployment section
   - Add SAM CLI to prerequisites
   - Link to lambda/README.md for detailed SAM instructions

**File Update Patterns**:

**package-all.sh header**:
```bash
#!/bin/bash
# DEPRECATED: This script is deprecated in favor of SAM deployment
# Use "sam build && sam deploy" instead
# See lambda/README.md for SAM deployment instructions
# This script is kept for emergency manual deployment only
```

**.gitignore additions**:
```
# SAM build artifacts
.aws-sam/

# Legacy Lambda deployment artifacts
lambda/dist/*.zip
```

**Verification Checklist**:
- [ ] package-all.sh updated or removed
- [ ] Deprecation notice added if keeping script
- [ ] Lambda README updated with SAM instructions
- [ ] .gitignore updated for SAM artifacts
- [ ] Legacy ZIP files removed from lambda/dist/
- [ ] Root README updated with SAM deployment
- [ ] No broken links in documentation
- [ ] Documentation is clear and accurate

**Testing Instructions**:
```bash
# Verify .gitignore works
cd lambda
sam build
git status
# .aws-sam/ should NOT appear in git status

# Verify documentation is clear
cat lambda/README.md
# Should prominently feature SAM deployment

# Verify legacy script still works (if kept)
./lambda/package-all.sh
# Should show deprecation notice
```

**Commit Message Template**:
```
chore(lambda): deprecate manual deployment scripts

- Add deprecation notice to package-all.sh
- Update Lambda README with SAM deployment instructions
- Add .aws-sam/ to .gitignore
- Remove legacy deployment artifacts
- Update root README with SAM prerequisites
```

**Estimated tokens**: ~7,000

---

### Task 8: Document SAM Deployment Process

**Goal**: Create comprehensive documentation for the SAM deployment process, enabling future developers to deploy and maintain the infrastructure confidently.

**Files to Create/Modify**:
- `lambda/README.md` - Complete SAM deployment guide
- `docs/SAM_DEPLOYMENT.md` - Detailed reference documentation
- Root `README.md` - Update deployment section

**Prerequisites**:
- All previous tasks complete
- SAM deployment proven to work
- Understanding of deployment process from hands-on experience

**Implementation Steps**:

1. **Create comprehensive Lambda README**:
   - Quick start section (TL;DR for experienced devs)
   - Prerequisites with installation links
   - Step-by-step deployment guide
   - Local testing instructions
   - Troubleshooting common issues
   - Environment configuration examples

2. **Create detailed reference documentation**:
   - SAM template architecture explanation
   - Parameter descriptions and defaults
   - Resource definitions and purposes
   - IAM policies and security considerations
   - Outputs and how to use them
   - Multi-environment deployment strategy (future)

3. **Add deployment workflow diagrams** (ASCII art):
   - Visual representation of deployment flow
   - Show interaction between SAM, CloudFormation, Lambda, API Gateway
   - Illustrate local vs. production deployment

4. **Document operational procedures**:
   - How to update Lambda function code
   - How to update API Gateway configuration
   - How to rollback a deployment
   - How to view logs in CloudWatch
   - How to monitor performance

5. **Add troubleshooting guide**:
   - Common errors and solutions
   - How to debug failed deployments
   - CloudFormation stack troubleshooting
   - Lambda cold start optimization
   - API Gateway CORS issues

6. **Include examples and commands**:
   - Actual working commands (not placeholders)
   - Example outputs for verification
   - Sample test events
   - Useful AWS CLI commands

**Documentation Structure**:

**lambda/README.md**:
```markdown
# Lambda Functions - SAM Deployment

## Quick Start
```bash
cd lambda
sam build
sam deploy
```

## Prerequisites
- AWS SAM CLI v1.100.0+
- AWS credentials configured
- Docker for local testing

## Deployment
[Step-by-step guide]

## Local Testing
[SAM local instructions]

## Troubleshooting
[Common issues]
```

**docs/SAM_DEPLOYMENT.md**:
```markdown
# SAM Deployment Architecture

## Overview
[Detailed explanation]

## Template Structure
[Section-by-section breakdown]

## Security
[IAM policies, permissions]

## Multi-Environment Strategy
[Future enhancement path]
```

**Verification Checklist**:
- [ ] lambda/README.md created and comprehensive
- [ ] docs/SAM_DEPLOYMENT.md created with technical details
- [ ] Root README.md updated with SAM deployment link
- [ ] All code examples tested and working
- [ ] Installation links are current and valid
- [ ] Troubleshooting section covers common issues
- [ ] Documentation reviewed for clarity
- [ ] No broken links or references

**Testing Instructions**:
```bash
# Verify links
grep -r "http" lambda/README.md docs/SAM_DEPLOYMENT.md
# Check all links are valid

# Test documented commands
# Follow lambda/README.md step-by-step
# Ensure each command works as documented

# Spell check
aspell check lambda/README.md
aspell check docs/SAM_DEPLOYMENT.md
```

**Documentation Quality Criteria**:
- Uses clear, concise language
- Includes working code examples
- Provides context (why, not just how)
- Anticipates common questions
- Links to official AWS documentation
- Includes visual aids (ASCII diagrams)
- Tested by following instructions verbatim

**Commit Message Template**:
```
docs(sam): add comprehensive SAM deployment documentation

- Create lambda/README.md with deployment guide
- Add docs/SAM_DEPLOYMENT.md with technical reference
- Update root README with SAM deployment section
- Include troubleshooting guide and examples
- Document local testing with SAM Local
```

**Estimated tokens**: ~10,000

---

## Phase Verification

### Complete Phase Checklist

Before proceeding to Phase 2, verify all items below:

**SAM Template**:
- [ ] `lambda/template.yaml` exists and validates
- [ ] All three Lambda functions defined
- [ ] API Gateway configured with CORS
- [ ] Parameters for environment-specific values
- [ ] Outputs provide useful deployment information

**Deployment Configuration**:
- [ ] `lambda/samconfig.toml` exists
- [ ] Stack name follows convention
- [ ] Parameter overrides correct
- [ ] Capabilities include CAPABILITY_IAM

**Local Testing**:
- [ ] SAM build succeeds
- [ ] Local API starts successfully
- [ ] All endpoints respond correctly locally
- [ ] Test events created for all functions

**Production Deployment**:
- [ ] CloudFormation stack deployed successfully
- [ ] All Lambda functions created
- [ ] API Gateway created with correct routes
- [ ] Stack outputs visible
- [ ] No rollback occurred

**Frontend Integration**:
- [ ] `.env` updated with new API endpoint
- [ ] Frontend connects to SAM-deployed API
- [ ] All API calls succeed
- [ ] No CORS errors

**Testing**:
- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Manual integration testing complete
- [ ] API endpoints verified with curl
- [ ] CloudWatch logs showing successful invocations

**Documentation**:
- [ ] lambda/README.md comprehensive
- [ ] docs/SAM_DEPLOYMENT.md created
- [ ] Root README.md updated
- [ ] Troubleshooting guide included

**Git State**:
- [ ] All changes committed
- [ ] Commit messages follow convention
- [ ] No uncommitted changes
- [ ] On feature branch

### Integration Testing

Perform these integration tests to confirm phase success:

```bash
# 1. Verify SAM deployment
cd lambda
sam build
sam deploy --no-confirm-changeset  # Should succeed with no changes

# 2. Test API endpoints
API_URL=$(sam list stack-outputs --output json | jq -r '.[].OutputValue' | grep https)
curl "${API_URL}/api/author/billy-collins" | jq .
curl "${API_URL}/api/authors/letter/B" | jq .
curl "${API_URL}/api/search/autocomplete?q=robert&limit=5" | jq .

# 3. Run test suites
cd ..
npm test
npm run test:e2e

# 4. Verify frontend
npm run dev
# Test in browser - all functionality should work
```

### Known Limitations

Document any limitations introduced in this phase:

1. **Single Environment**: Currently deploys only to production. Multi-environment support designed but not implemented.

2. **Manual API URL Update**: After deployment, `.env` must be manually updated. Could be automated with post-deployment script.

3. **Cold Starts**: Lambda cold starts may cause 2-5 second delays on first invocation. Could be mitigated with provisioned concurrency (costs money).

4. **No CI/CD**: Deployment is manual via `sam deploy`. GitHub Actions workflow could automate this (future enhancement).

### Success Metrics

Confirm these measurable outcomes:

- [ ] Deployment time reduced from ~15 minutes (manual) to ~3 minutes (SAM)
- [ ] Zero manual steps after `sam deploy`
- [ ] API response times < 2 seconds (warm invocations)
- [ ] All 31 unit tests passing
- [ ] All 66 E2E tests passing
- [ ] Zero CORS errors in browser console
- [ ] CloudWatch logs show zero Lambda errors

### Rollback Procedure

If issues occur, rollback using:

```bash
# Option 1: Rollback CloudFormation stack
aws cloudformation delete-stack --stack-name writers-almanac-backend-prod

# Option 2: Manual Lambda deployment (if package-all.sh kept)
cd lambda
./package-all.sh
# Then manually upload ZIPs via AWS Console

# Option 3: Restore previous CloudFormation stack
aws cloudformation create-change-set --stack-name writers-almanac-backend-prod \
  --change-set-name rollback --template-body file://previous-template.yaml
```

### Next Steps

Phase 1 is complete! Proceed to:
- **[Phase 2: Test Coverage Improvement](./Phase-2.md)** - Analyze and improve test coverage to 85%+

---

## Summary

Phase 1 automated the Lambda deployment process using AWS SAM, replacing manual ZIP uploads with infrastructure-as-code. The SAM template manages three Lambda functions and API Gateway configuration, integrating seamlessly with existing S3 and CloudFront resources. Local testing with SAM Local provides rapid development feedback, and comprehensive documentation ensures future maintainability.

**Key Achievements**:
- ✅ Single-command deployment: `sam deploy`
- ✅ Infrastructure as code: `template.yaml`
- ✅ Local testing capability: `sam local start-api`
- ✅ Comprehensive documentation
- ✅ Zero regressions (all tests passing)

**Files Changed**:
- Created: `lambda/template.yaml`
- Created: `lambda/samconfig.toml`
- Created: `lambda/events/*.json`
- Created: `docs/SAM_DEPLOYMENT.md`
- Modified: `lambda/README.md`, `.env`, `.gitignore`, root `README.md`
- Deprecated: `lambda/package-all.sh`

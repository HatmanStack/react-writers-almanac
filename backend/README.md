# Lambda Functions - SAM Deployment Guide

This directory contains AWS Lambda functions for The Writer's Almanac API, managed through AWS SAM (Serverless Application Model) for automated, infrastructure-as-code deployment.

## Quick Start

```bash
cd lambda
sam build
sam deploy
```

That's it! SAM handles packaging, deploying Lambda functions, and configuring API Gateway automatically.

---

## Table of Contents

- [Lambda Functions](#lambda-functions)
- [Prerequisites](#prerequisites)
- [SAM Deployment (Recommended)](#sam-deployment-recommended)
- [Local Testing](#local-testing)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Monitoring](#monitoring)
- [Legacy Manual Deployment](#legacy-manual-deployment)

---

## Lambda Functions

### 1. get-author
- **Path**: `lambda/get-author/`
- **Purpose**: Fetch individual author data by name/slug from S3
- **Endpoint**: `GET /api/author/{name}`
- **Handler**: `index.handler`
- **Memory**: 256 MB
- **Timeout**: 30 seconds

### 2. get-authors-by-letter
- **Path**: `lambda/get-authors-by-letter/`
- **Purpose**: Fetch all authors starting with a specific letter
- **Endpoint**: `GET /api/authors/letter/{letter}`
- **Handler**: `index.handler`
- **Memory**: 256 MB
- **Timeout**: 30 seconds

### 3. search-autocomplete
- **Path**: `lambda/search-autocomplete/`
- **Purpose**: Search autocomplete for authors with in-memory caching
- **Endpoint**: `GET /api/search/autocomplete?q={query}&limit={limit}`
- **Handler**: `index.handler`
- **Memory**: 512 MB (higher due to caching)
- **Timeout**: 30 seconds

---

## Prerequisites

### Required Tools

Install these tools before deploying:

1. **AWS SAM CLI** (v1.100.0+)
   ```bash
   # macOS
   brew install aws-sam-cli

   # Windows/Linux - see official docs
   # https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
   ```

2. **AWS CLI** (v2.13.0+)
   ```bash
   # macOS
   brew install awscli

   # Windows/Linux - see official docs
   # https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
   ```

3. **Docker** (for local testing)
   ```bash
   # Required for SAM local testing
   # Download from https://www.docker.com/get-started
   ```

4. **Node.js 22.x**
   ```bash
   node --version  # Should be v22.x or later
   ```

### AWS Configuration

Configure AWS credentials:

```bash
aws configure

# You'll be prompted for:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Output format (json)
```

Verify credentials:

```bash
aws sts get-caller-identity
```

### Required IAM Permissions

Your AWS user/role needs permissions for:
- Lambda function creation/update
- API Gateway management
- CloudFormation stack operations
- S3 read access (existing bucket)
- CloudWatch Logs
- IAM role creation (for Lambda execution role)

---

## SAM Deployment (Recommended)

### First-Time Setup

1. **Configure deployment parameters** in `samconfig.toml`:
   ```toml
   parameter_overrides = [
       "Environment=prod",
       "S3BucketName=your-actual-bucket-name",  # ← UPDATE THIS
       "AWSRegion=us-east-1"                    # ← UPDATE IF NEEDED
   ]
   ```

2. **Validate template**:
   ```bash
   cd lambda
   sam validate --lint
   ```

3. **Build Lambda functions**:
   ```bash
   sam build
   ```
   This installs dependencies and packages each function into `.aws-sam/` directory.

4. **Deploy with guided prompts** (first time only):
   ```bash
   sam deploy --guided
   ```

   You'll be asked to confirm:
   - Stack name: `writers-almanac-backend-prod`
   - AWS region: `us-east-1`
   - Parameter values (S3 bucket, environment)
   - Confirm IAM role creation: `Y`
   - Confirm changeset: `Y`

5. **Save deployment configuration**:
   SAM saves your answers to `samconfig.toml` for future deployments.

### Subsequent Deployments

After the first deployment, updating is simple:

```bash
cd lambda
sam build && sam deploy
```

No prompts - uses saved configuration from `samconfig.toml`.

### Deployment Output

After successful deployment, SAM outputs:

```
CloudFormation outputs from deployed stack
---------------------------------------------------------
Outputs
---------------------------------------------------------
Key                 ApiUrl
Description         API Gateway endpoint URL for production stage
Value               https://abc123xyz.execute-api.us-east-1.amazonaws.com/Prod

Key                 GetAuthorFunctionArn
Description         ARN of the GetAuthor Lambda function
Value               arn:aws:lambda:us-east-1:123456789:function:writers-almanac-get-author-prod
...
```

**Important**: Copy the `ApiUrl` value and update your `.env` file:

```bash
# In project root .env file
VITE_API_BASE_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/Prod
```

---

## Local Testing

### Test Individual Functions

Create test event files in `events/` directory (already provided):

```bash
# Build functions first
cd lambda
sam build

# Invoke specific function with test event
sam local invoke GetAuthorFunction --event events/get-author-event.json

# Expected output: JSON response with author data
```

### Test Complete API Locally

Start local API Gateway emulator:

```bash
cd lambda
sam local start-api

# API runs at http://localhost:3000
```

In another terminal, test endpoints:

```bash
# Test get-author
curl http://localhost:3000/api/author/billy-collins

# Test get-authors-by-letter
curl http://localhost:3000/api/authors/letter/B

# Test search-autocomplete
curl "http://localhost:3000/api/search/autocomplete?q=billy&limit=5"
```

**Note**: Local testing requires Docker to be running and valid AWS credentials (to access S3).

---

## Configuration

### Environment Variables

All Lambda functions receive these environment variables automatically from SAM template:

- `S3_BUCKET`: S3 bucket name containing author/poem data (from parameter)
- `AWS_REGION`: AWS region (from parameter)
- `NODE_ENV`: `production` (set globally)

Configure these in `samconfig.toml`, not in individual Lambda functions.

### SAM Template Parameters

Edit `samconfig.toml` to change deployment configuration:

```toml
parameter_overrides = [
    "Environment=prod",              # Environment name (dev/staging/prod)
    "S3BucketName=your-bucket-name", # Existing S3 bucket
    "AWSRegion=us-east-1"           # AWS region
]
```

### Multi-Environment Deployment

The template supports multiple environments. To deploy to staging:

```bash
sam build
sam deploy --config-env staging
```

First, add a `[staging]` section to `samconfig.toml`:

```toml
[staging]
[staging.deploy.parameters]
stack_name = "writers-almanac-backend-staging"
parameter_overrides = [
    "Environment=staging",
    "S3BucketName=your-staging-bucket-name",
    "AWSRegion=us-east-1"
]
```

---

## Troubleshooting

### SAM Build Fails

**Symptom**: `sam build` fails with "Build Failed" error

**Solutions**:
- Validate template: `sam validate --lint`
- Check each Lambda directory has `package.json`
- Ensure Node.js 22.x is installed: `node --version`
- Build with debug output: `sam build --debug`

### SAM Deploy Fails - IAM Permissions

**Symptom**: CloudFormation stack creation fails with permission errors

**Solution**: Ensure your AWS user/role has CloudFormation, Lambda, API Gateway, and IAM permissions.

### CORS Errors in Browser

**Symptom**: Browser console shows CORS errors when calling API

**Cause**: CORS is configured in SAM template, but verify:

1. Lambda functions return CORS headers (already implemented)
2. API Gateway has CORS enabled (automatically done by SAM)
3. You've deployed after making changes: `sam deploy`

### Lambda Can't Access S3

**Symptom**: Lambda logs show "Access Denied" errors

**Solutions**:
- Verify `S3BucketName` parameter in `samconfig.toml` is correct
- Ensure S3 bucket exists and has data files
- Check Lambda execution role has S3 read permissions (automatically added by SAM)

### Function Times Out

**Symptom**: API Gateway returns 504 Gateway Timeout

**Solutions**:
- Check CloudWatch Logs for the function: `/aws/lambda/writers-almanac-*-prod`
- Increase timeout in `template.yaml` if needed (currently 30 seconds)
- Verify S3 bucket is in same region as Lambda
- Check network connectivity to S3

### Local API Doesn't Start

**Symptom**: `sam local start-api` fails

**Solutions**:
- Ensure Docker is running: `docker ps`
- Build first: `sam build`
- Check port 3000 isn't in use: `lsof -i :3000`
- Use different port: `sam local start-api --port 3001`

### Environment Variable Not Set

**Symptom**: Lambda logs show "S3_BUCKET is undefined"

**Solution**: Environment variables are set in `template.yaml` Globals section and per-function. Verify `samconfig.toml` has correct `S3BucketName` parameter.

---

## Monitoring

### CloudWatch Logs

View logs for each function:

```bash
# Stream logs in real-time
aws logs tail /aws/lambda/writers-almanac-get-author-prod --follow

# View recent logs
aws logs tail /aws/lambda/writers-almanac-get-author-prod --since 1h

# All functions
aws logs tail /aws/lambda/writers-almanac-get-authors-by-letter-prod --follow
aws logs tail /aws/lambda/writers-almanac-search-autocomplete-prod --follow
```

### CloudWatch Metrics

Monitor in CloudWatch console:
- **Invocations**: Total requests
- **Duration**: Execution time (cold vs. warm starts)
- **Errors**: Failed invocations
- **Throttles**: Rate limiting

### SAM Stack Information

View deployed resources:

```bash
# List stack outputs (API URL, ARNs)
sam list stack-outputs

# List all resources in stack
sam list resources

# View stack events
aws cloudformation describe-stack-events \
  --stack-name writers-almanac-backend-prod
```

---

## Rollback

If a deployment causes issues:

### Option 1: Rollback via CloudFormation

```bash
# Delete the stack (careful - this removes all resources)
sam delete

# Or via AWS CLI
aws cloudformation delete-stack --stack-name writers-almanac-backend-prod
```

### Option 2: Redeploy Previous Version

```bash
# Check out previous git commit with working template
git checkout <previous-commit>

# Redeploy
cd lambda
sam build && sam deploy
```

---

## SAM Template Architecture

See `docs/SAM_DEPLOYMENT.md` for detailed technical documentation on:
- Template structure and design decisions
- Parameter descriptions
- Resource definitions
- IAM policies and security
- Multi-environment strategy
- Performance optimization

---

## Legacy Manual Deployment

**⚠️ DEPRECATED**: Manual deployment via `package-all.sh` is deprecated. Use SAM deployment instead.

For emergency manual deployment only, see legacy documentation in git history:

```bash
git show HEAD~1:lambda/README.md
```

Or use the deprecated script (not recommended):

```bash
./package-all.sh
# Then manually upload ZIP files via AWS Console or CLI
```

---

## Dependencies

All functions use:
- **Runtime**: Node.js 22.x (active LTS)
- **AWS SDK**: `@aws-sdk/client-s3` ^3.600.0

Dependencies are automatically installed by `sam build`.

---

## Cost Optimization

- **Free Tier**: First 1 million Lambda requests/month free
- **Caching**: search-autocomplete uses in-memory caching to reduce S3 calls
- **Cold Starts**: Initial request ~2-5 seconds; warm requests ~100-500ms
- **Provisioned Concurrency**: Not configured (would cost money but eliminate cold starts)

---

## Security

- **Environment Variables**: Managed via SAM parameters, never committed
- **IAM Roles**: SAM creates least-privilege execution roles automatically
- **CORS**: Currently allows all origins (`*`) - restrict in production if needed
- **Rate Limiting**: API Gateway default rate limits apply (10,000 req/sec)
- **Secrets**: Use AWS Secrets Manager for sensitive values (not needed currently)

---

## Version History

- **v2.0** (2024-11-19): SAM deployment infrastructure added
- **v1.0** (2024-10-24): Initial Lambda functions created with manual deployment

---

## Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [SAM CLI Reference](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [API Gateway REST API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-rest-api.html)

For questions or issues, check the troubleshooting section or consult `docs/SAM_DEPLOYMENT.md` for technical details.

# Lambda Functions - SAM Deployment Guide

This directory contains AWS Lambda functions for The Writer's Almanac API, managed through AWS SAM (Serverless Application Model) for automated, infrastructure-as-code deployment.

## Quick Start

From the repository root:

```bash
npm run deploy
```

That runs [`backend/scripts/deploy.sh`](scripts/deploy.sh), which prompts for the
deployment settings, generates `samconfig.toml`, builds and deploys the stack,
and writes the resulting API URL into `frontend/.env`. It is the only deployment
path this repository supports; see
[SAM Deployment](#sam-deployment-the-npm-run-deploy-path) for what it does step
by step.

`sam build && sam deploy` from inside `backend/` also works, because
`samconfig.toml` is committed with working values — but it will not update
`frontend/.env`, and the next `npm run deploy` overwrites `samconfig.toml` with
whatever the prompts produce. Prefer `npm run deploy`.

---

## Table of Contents

- [Lambda Functions](#lambda-functions)
- [Prerequisites](#prerequisites)
- [SAM Deployment](#sam-deployment-the-npm-run-deploy-path)
- [Local Testing](#local-testing)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Monitoring](#monitoring)

---

## Lambda Functions

### 1. get-author

- **Path**: `lambdas/get-author/`
- **Purpose**: Fetch individual author data by name/slug from S3
- **Endpoint**: `GET /api/author/{name}`
- **Handler**: `index.handler`
- **Memory**: 256 MB
- **Timeout**: 30 seconds

### 2. get-authors-by-letter

- **Path**: `lambdas/get-authors-by-letter/`
- **Purpose**: Fetch all authors starting with a specific letter
- **Endpoint**: `GET /api/authors/letter/{letter}`
- **Handler**: `index.handler`
- **Memory**: 256 MB
- **Timeout**: 30 seconds

### 3. search-autocomplete

- **Path**: `lambdas/search-autocomplete/`
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

5. **Lambda dependencies** — a separate install from the repository root's:

   ```bash
   cd backend/lambdas && npm ci
   ```

   `backend/lambdas` is not an npm workspace member: the root `workspaces` glob
   is `backend/lambdas/*`, which matches the four handler directories rather than
   the directory holding their shared `package.json` and lockfile. `sam build`
   installs these itself, so this step is needed only for running the handlers or
   their tests outside SAM — which is exactly why
   `.github/workflows/ci.yml` runs it before `sam validate`.

### AWS Configuration

Configure AWS credentials:

```bash
aws configure

# You'll be prompted for:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (the deployed stack uses us-west-2 - see Region below)
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

## SAM Deployment: the `npm run deploy` path

> **`samconfig.toml` is generated output, not input.**
> `backend/scripts/deploy.sh:71-86` overwrites it on every run, and its own first
> line says so. Anything you hand-edit into that file is erased by the next
> deploy. Change the inputs instead — the script's prompts, or the `.env.deploy`
> file it saves them to.

### What `deploy.sh` does

1. **Loads previous answers** from `backend/.env.deploy` if it exists, and prompts
   for four values, each defaulting to what it loaded: AWS region, stack name,
   environment (`dev`/`staging`/`prod`), and the name of the **existing** S3 data
   bucket holding the author and poem JSON. The bucket name is required; the
   script exits if it is empty.
2. **Saves those answers** back to `backend/.env.deploy`.
3. **Generates `backend/samconfig.toml`** from them, including `region`,
   `stack_name`, and `parameter_overrides`.
4. **Creates the SAM deployment bucket** `sam-deploy-writers-almanac-{region}` if
   it does not already exist. This is the artifact bucket SAM uploads packages
   to — it is not the data bucket.
5. **Runs `sam build`**, then `sam deploy` with the stack name, region, and
   parameter overrides passed explicitly on the command line.
6. **Reads the `ApiUrl` stack output** and writes it into `frontend/.env` as
   `VITE_API_BASE_URL`. See [Frontend configuration](#frontend-configuration).

### Two files, one gitignored and one tracked

`backend/.env.deploy` holds your answers and is gitignored (`.gitignore:26`).
`backend/samconfig.toml` is derived from it and **is tracked**. So every deploy
from a machine whose answers differ from the committed ones produces a diff in a
tracked file — most visibly `region`, `s3_bucket`, and the bucket name inside
`parameter_overrides`. This is a known condition of the current setup, recorded
here so an unexpected `git status` after a deploy is not a mystery. Whether
`samconfig.toml` should be tracked at all is a backend decision that has not been
made.

### Validating and building without deploying

```bash
cd backend
sam validate --lint    # CI runs `sam validate --region us-west-2`
sam build              # packages each function into backend/.aws-sam/
```

### Deploying without the script

If you deploy with bare `sam` commands, `samconfig.toml` supplies the
configuration:

```bash
cd backend
sam build && sam deploy
```

Nothing then updates `frontend/.env`; do that by hand, or re-run
`npm run deploy`.

### Deployment Output

After successful deployment, SAM outputs:

```
CloudFormation outputs from deployed stack
---------------------------------------------------------
Outputs
---------------------------------------------------------
Key                 ApiUrl
Description         API Gateway endpoint URL for production stage
Value               https://abc123xyz.execute-api.us-west-2.amazonaws.com/Prod

Key                 GetAuthorFunctionArn
Description         ARN of the GetAuthor Lambda function
Value               arn:aws:lambda:us-west-2:123456789:function:writers-almanac-get-author-prod
...
```

### Frontend configuration

`npm run deploy` writes the `ApiUrl` output into **`frontend/.env`** for you
(`backend/scripts/deploy.sh:7` targets `../frontend/.env`). There is no `.env` at
the repository root and nothing reads one — the frontend is a Vite app and Vite
loads `.env` from `frontend/`.

If you deployed with bare `sam` commands, copy the `ApiUrl` value in by hand:

```bash
# frontend/.env
VITE_API_BASE_URL=https://abc123xyz.execute-api.us-west-2.amazonaws.com/Prod
```

The full set of variables the frontend reads is documented in
[`frontend/.env.example`](../frontend/.env.example) — `VITE_API_BASE_URL` and
`VITE_CDN_BASE_URL`. The CDN one is not a stack output (CloudFront is not managed
by this template), so `deploy.sh` cannot fill it in; set it yourself or let
`frontend/src/api/client.ts:21-22` fall back to the hardcoded distribution.

---

## Local Testing

### Test Individual Functions

Create test event files in `events/` directory (already provided):

```bash
# Build functions first
cd backend
sam build

# Invoke specific function with test event
sam local invoke GetAuthorFunction --event events/get-author-event.json

# Expected output: JSON response with author data
```

### Test Complete API Locally

Start local API Gateway emulator:

```bash
cd backend
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
- `NODE_ENV`: `production` (set globally)
- `AWS_REGION`: Set automatically by AWS Lambda runtime (not a template parameter)

`S3_BUCKET` comes from the `S3BucketName` template parameter. Set it by answering
the `npm run deploy` prompt, **not** by editing `samconfig.toml` — the script
regenerates that file from your answers.

### SAM Template Parameters

`backend/template.yaml` takes two parameters, and `deploy.sh` supplies both:

| Parameter      | Set from                  | Committed value |
| -------------- | ------------------------- | --------------- |
| `Environment`  | the environment prompt    | `prod`          |
| `S3BucketName` | the S3 data bucket prompt | `garrison-twa`  |

Both land in `samconfig.toml`'s `parameter_overrides` and are also passed
explicitly on the `sam deploy` command line (`deploy.sh:128`).

### Multi-Environment Deployment

**There is no working multi-environment mechanism today, and this section
previously described one that erases itself.** It told you to add a `[staging]`
section to `samconfig.toml` and then run `sam deploy --config-env staging`. But
`deploy.sh` regenerates `samconfig.toml` with a single `[default.deploy.parameters]`
table, so the `[staging]` section is wiped by the next `npm run deploy` and the
`--config-env staging` command fails afterwards.

What does work: `deploy.sh` prompts for both the environment name and the stack
name, and every resource in `template.yaml` is named with `${Environment}`. So a
second environment is a second run of `npm run deploy` answering
`writers-almanac-backend-staging` and `staging`. That gives a genuinely separate
stack, at the cost of `samconfig.toml` now describing staging rather than prod
until the next prod deploy rewrites it.

Making `--config-env` work would mean teaching `deploy.sh` to emit named config
tables instead of overwriting one. That has not been done.

### Region

**The Lambdas and the S3 data bucket are in different regions.** The stack
deploys to `us-west-2` (`samconfig.toml:10`), and the `garrison-twa` data bucket
is in `us-west-1`. Every Lambda S3 read is therefore cross-region.

Note also that `deploy.sh:23` defaults the region prompt to `us-west-1`, which
disagrees with the committed `us-west-2` — accepting the default on a fresh
machine deploys to a different region than the committed configuration describes.

Today this has no practical effect: nothing in the running frontend calls the API
tier, so these functions serve no traffic. It would matter as soon as they did —
cross-region S3 reads add latency and inter-region transfer cost to every cold
lookup.

**This is recorded, not recommended.** Relocating a stack is a production deploy,
and which way to resolve it — move the stack, move the bucket, or retire the
tier — is an open decision.

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

- Verify the `S3BucketName` value the deploy actually used — check the
  `parameter_overrides` line in the generated `samconfig.toml`, and re-run
  `npm run deploy` to change it
- Ensure S3 bucket exists and has data files
- Check Lambda execution role has S3 read permissions (automatically added by SAM)
- **Check the key, not just the bucket.** These handlers read `authors/by-name/`
  and `authors/by-letter/`, while the objects in the bucket sit under a `public/`
  prefix (`public/authors/by-name/…`) — see the Known discrepancies section of
  [`scripts/s3-structure.md`](../scripts/s3-structure.md). A missing key can
  surface as an S3 error rather than an obvious 404.

### Function Times Out

**Symptom**: API Gateway returns 504 Gateway Timeout

**Solutions**:

- Check CloudWatch Logs for the function: `/aws/lambda/writers-almanac-*-prod`
- Increase timeout in `template.yaml` if needed (currently 30 seconds)
- Note that the S3 reads are **cross-region** — the stack is in `us-west-2` and
  the `garrison-twa` bucket is in `us-west-1` (see [Region](#region)), so they
  carry more latency than a same-region read would
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

**Solution**: Environment variables are set in `template.yaml` Globals section and per-function. Check that the deploy passed a non-empty `S3BucketName` — the generated `samconfig.toml`'s `parameter_overrides` line records what was used. Re-run `npm run deploy` to change it rather than editing that file.

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
cd backend
sam build && sam deploy
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

Stated as current fact. Nothing here is a recommendation.

- **Environment Variables**: passed as SAM template parameters, not baked into
  the sources. They are not secret, and they are not uncommitted either — the
  generated `samconfig.toml` is tracked and carries `S3BucketName=garrison-twa`
  in plain text. Only `backend/.env.deploy` is gitignored.
- **IAM Roles**: each function gets `S3ReadPolicy` scoped to the data bucket,
  which is tight, **plus `CloudWatchLogsFullAccess`**, which is an AWS-managed
  policy covering CloudWatch Logs account-wide rather than just the function's own
  log group (`template.yaml:79`, `:107`, `:140`). Read "least privilege" as
  applying to the S3 half only.
- **CORS**: allows all origins (`*`), configured in the template's `Globals.Api`
  section.
- **Authentication**: none. The API has no authorizer, no API key, and no usage
  plan (`grep -n "UsagePlan\|ApiKey\|Auth:" template.yaml` returns nothing), so
  every endpoint is publicly callable. Only API Gateway's default account-level
  throttling applies.
- **Secrets**: none are used, so none are managed.

---

## Version History

This directory does not carry its own version. It ships with the repository, and
the repository's version is the one in `package.json` and in `CHANGELOG.md` —
`1.4.0` at the time of writing, tagged `v1.4.0`. An earlier private "v2.0 / v1.0"
scheme here described the same code under different numbers and has been removed.
See the root [`CHANGELOG.md`](../CHANGELOG.md) for backend changes, which are
recorded there alongside everything else.

---

## Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [SAM CLI Reference](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [API Gateway REST API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-rest-api.html)

For questions or issues, check the troubleshooting section above.

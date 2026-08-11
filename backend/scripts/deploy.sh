#!/bin/bash
set -e

cd "$(dirname "$0")/.."

ENV_DEPLOY_FILE=".env.deploy"
FRONTEND_ENV="../frontend/.env"

echo "==================================="
echo "Writers Almanac - Backend Deployment"
echo "==================================="
echo ""

# Load from .env.deploy if it exists
if [ -f "$ENV_DEPLOY_FILE" ]; then
    echo "Loading configuration from $ENV_DEPLOY_FILE..."
    set -a
    . "$ENV_DEPLOY_FILE"
    set +a
fi

# Get region with default
DEFAULT_REGION="${AWS_REGION:-us-west-1}"
read -p "AWS Region [$DEFAULT_REGION]: " input_region
AWS_REGION="${input_region:-$DEFAULT_REGION}"

# Get stack name with default
DEFAULT_STACK="${STACK_NAME:-writers-almanac-backend-prod}"
read -p "Stack Name [$DEFAULT_STACK]: " input_stack
STACK_NAME="${input_stack:-$DEFAULT_STACK}"

# Get environment with default
DEFAULT_ENV="${ENVIRONMENT:-prod}"
read -p "Environment (dev/staging/prod) [$DEFAULT_ENV]: " input_env
ENVIRONMENT="${input_env:-$DEFAULT_ENV}"

# Get S3 bucket name
echo ""
echo "--- S3 Data Bucket ---"
echo "This bucket contains the author/poem data (pre-existing, not managed by SAM)"
echo ""

DEFAULT_BUCKET="${S3_BUCKET_NAME:-}"
if [ -n "$S3_BUCKET_NAME" ]; then
    echo "S3 Bucket: [$S3_BUCKET_NAME - press Enter to keep]"
else
    echo "S3 Bucket: [not set - required]"
fi
read -p "> " input_bucket
S3_BUCKET_NAME="${input_bucket:-$S3_BUCKET_NAME}"

if [ -z "$S3_BUCKET_NAME" ]; then
    echo "ERROR: S3 bucket name is required"
    exit 1
fi

# Save configuration
cat > "$ENV_DEPLOY_FILE" << EOF
# Deployment configuration (auto-saved)
AWS_REGION=$AWS_REGION
STACK_NAME=$STACK_NAME
ENVIRONMENT=$ENVIRONMENT
S3_BUCKET_NAME=$S3_BUCKET_NAME
EOF
echo ""
echo "Configuration saved to $ENV_DEPLOY_FILE"

# Generate samconfig.toml
DEPLOY_BUCKET="sam-deploy-writers-almanac-${AWS_REGION}"

cat > "samconfig.toml" << EOF
# SAM CLI configuration file (auto-generated from .env.deploy)
# Re-run ./scripts/deploy.sh to regenerate this file

version = 0.1

[default.deploy.parameters]
stack_name = "$STACK_NAME"
s3_bucket = "$DEPLOY_BUCKET"
s3_prefix = "$STACK_NAME"
region = "$AWS_REGION"
capabilities = "CAPABILITY_IAM"
confirm_changeset = false
fail_on_empty_changeset = false
parameter_overrides = "Environment=$ENVIRONMENT S3BucketName=$S3_BUCKET_NAME"
EOF
echo "Updated samconfig.toml"

echo ""
echo "Using configuration:"
echo "  Region: $AWS_REGION"
echo "  Stack Name: $STACK_NAME"
echo "  Environment: $ENVIRONMENT"
echo "  S3 Data Bucket: $S3_BUCKET_NAME"
echo ""

# Create deployment bucket if needed
echo "==================================="
echo "Step 1: Setup Deployment Bucket"
echo "==================================="

if ! aws s3 ls "s3://${DEPLOY_BUCKET}" --region "$AWS_REGION" 2>/dev/null; then
    echo "Creating deployment bucket: ${DEPLOY_BUCKET}"
    aws s3 mb "s3://${DEPLOY_BUCKET}" --region "$AWS_REGION"
else
    echo "Deployment bucket exists: ${DEPLOY_BUCKET}"
fi

echo ""
echo "==================================="
echo "Step 2: Build SAM Application"
echo "==================================="
echo ""
sam build --template template.yaml

echo ""
echo "==================================="
echo "Step 3: Deploy Stack"
echo "==================================="
echo ""

sam deploy \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --s3-bucket "$DEPLOY_BUCKET" \
    --s3-prefix "$STACK_NAME" \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides "Environment=$ENVIRONMENT" "S3BucketName=$S3_BUCKET_NAME" \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset

echo ""
echo "==================================="
echo "Deployment Complete!"
echo "==================================="
echo ""

# Get stack outputs
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

echo "Stack Outputs:"
echo "  API URL: $API_URL"
echo ""

# ---------------------------------------------------------------------------
# frontend/.env
#
# The app reads exactly two variables, both at frontend/src/api/client.ts:21-24:
#
#   VITE_API_BASE_URL  API Gateway stage fronting the Lambda functions
#   VITE_CDN_BASE_URL  CloudFront distribution serving poems, authors and audio
#
# frontend/.env.example documents the same two. This block writes that set and
# nothing more. It used to also write VITE_AWS_REGION and VITE_S3_BUCKET, which
# nothing in frontend/src has ever read, and to omit VITE_CDN_BASE_URL, which is
# the only CDN variable the app does read -- so a fresh deploy produced a .env
# carrying two dead variables and silently falling back on the live one.
#
# VITE_CDN_BASE_URL cannot be derived here. CloudFront is not managed by this
# SAM template, so the stack has no CloudFront output to read. It is therefore
# emitted EMPTY with guidance, and an existing value is never overwritten: a
# developer who has pointed the app at their own distribution must not have it
# clobbered by a deploy.
# ---------------------------------------------------------------------------

# `>>` writes at the byte after the last one, so a .env whose final line has no
# trailing newline gets the new key glued onto the end of it -- producing e.g.
# `VITE_API_BASE_URL=https://…VITE_CDN_BASE_URL=` on one line, which neither Vite
# nor a human reads correctly. Every append below goes through this. The
# create-from-scratch path above always ends with a newline, so this only fires
# on a .env some other tool or editor wrote.
#
# Command substitution strips trailing newlines, so `$(tail -c1 "$file")` is
# empty exactly when the last byte IS a newline (or the file is empty).
append_env_line() {
    local line=$1
    local file=$2

    if [ -s "$file" ] && [ -n "$(tail -c1 "$file")" ]; then
        echo "" >> "$file"
    fi
    echo "$line" >> "$file"
}

# Update frontend .env file (portable across GNU/BSD sed)
update_env_var() {
    local key=$1
    local value=$2
    local file=$3

    if [ -z "$value" ] || [ "$value" = "None" ]; then
        return
    fi

    if grep -q "^${key}=" "$file" 2>/dev/null; then
        local tmp="${file}.tmp.$$"
        sed "s|^${key}=.*|${key}=${value}|" "$file" > "$tmp" && mv "$tmp" "$file"
    else
        append_env_line "${key}=${value}" "$file"
    fi
}

# Append a key only when it is absent, never touching an existing line. For
# values this script cannot derive, so a developer's own setting survives every
# deploy.
ensure_env_var() {
    local key=$1
    local file=$2

    if ! grep -q "^${key}=" "$file" 2>/dev/null; then
        append_env_line "${key}=" "$file"
    fi
}

# Read a key back out, so the closing note can say whether it ended up set.
read_env_var() {
    local key=$1
    local file=$2

    sed -n "s|^${key}=||p" "$file" 2>/dev/null | head -1
}

# Create frontend/.env if it doesn't exist
if [ ! -f "$FRONTEND_ENV" ]; then
    cat > "$FRONTEND_ENV" << EOF
# AWS Configuration (auto-generated by deploy.sh)

# API Gateway stage fronting the Lambda functions, from the stack's ApiUrl output.
VITE_API_BASE_URL=$API_URL

# CloudFront distribution serving poems, authors and audio.
# deploy.sh cannot fill this in: CloudFront is not managed by the SAM template,
# so the stack has no such output. Left empty, frontend/src/api/client.ts:21-22
# falls back to the distribution hardcoded there. Set it to point somewhere
# else -- deploy.sh will not overwrite a value you put here.
VITE_CDN_BASE_URL=
EOF
    echo "Created frontend .env file"
else
    update_env_var "VITE_API_BASE_URL" "$API_URL" "$FRONTEND_ENV"
    # Add-if-absent, never overwrite -- see the block comment above.
    ensure_env_var "VITE_CDN_BASE_URL" "$FRONTEND_ENV"
    echo "Updated frontend .env file"
fi

echo ""
echo "Done! Frontend .env has been updated with stack outputs."
echo "  Path: frontend/.env"

if [ -z "$(read_env_var VITE_CDN_BASE_URL "$FRONTEND_ENV")" ]; then
    echo ""
    echo "NOTE: VITE_CDN_BASE_URL is empty in frontend/.env."
    echo "  This deploy cannot set it -- CloudFront is not managed by the SAM"
    echo "  template, so the stack has no CloudFront output to read. The app"
    echo "  will fall back to the distribution hardcoded at"
    echo "  frontend/src/api/client.ts:21. Set it in frontend/.env if your"
    echo "  content is served from a different one."
fi

echo ""
echo "To run the frontend locally:"
echo "  npm run dev"

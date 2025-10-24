# API Gateway Setup Guide

## Overview

This guide provides step-by-step instructions for creating and configuring API Gateway to connect to the Lambda functions.

## Prerequisites

- Lambda functions deployed and tested
- S3 bucket with author data uploaded
- AWS CLI configured (optional, for CLI method)

---

## Method 1: AWS Console (Recommended for First-Time Setup)

### Step 1: Create REST API

1. Go to [API Gateway Console](https://console.aws.amazon.com/apigateway)
2. Click **Create API**
3. Choose **REST API** (not Private or HTTP API)
4. Click **Build**
5. Configure:
   - **Protocol**: REST
   - **Create new API**: New API
   - **API name**: `writers-almanac-api`
   - **Description**: API for Writer's Almanac application
   - **Endpoint Type**: Regional (or Edge optimized for global users)
6. Click **Create API**

### Step 2: Create Resources

#### Create `/api` resource:
1. Select the root `/` resource
2. Click **Actions** → **Create Resource**
3. **Resource Name**: `api`
4. **Resource Path**: `api`
5. Check **Enable API Gateway CORS** (optional, can configure later)
6. Click **Create Resource**

#### Create `/api/author` resource:
1. Select `/api` resource
2. Click **Actions** → **Create Resource**
3. **Resource Name**: `author`
4. **Resource Path**: `author`
5. Click **Create Resource**

#### Create `/api/author/{name}` resource:
1. Select `/api/author` resource
2. Click **Actions** → **Create Resource**
3. **Resource Name**: `name`
4. **Resource Path**: `{name}`
5. Check **Enable API Gateway CORS**
6. Click **Create Resource**

#### Create `/api/authors` resource:
1. Select `/api` resource
2. Click **Actions** → **Create Resource**
3. **Resource Name**: `authors`
4. Click **Create Resource**

#### Create `/api/authors/letter` resource:
1. Select `/api/authors`
2. Click **Actions** → **Create Resource**
3. **Resource Name**: `letter`
4. Click **Create Resource**

#### Create `/api/authors/letter/{letter}` resource:
1. Select `/api/authors/letter`
2. Click **Actions** → **Create Resource**
3. **Resource Name**: `letter`
4. **Resource Path**: `{letter}`
5. Check **Enable API Gateway CORS**
6. Click **Create Resource**

#### Create `/api/search` resource:
1. Select `/api`
2. Click **Actions** → **Create Resource**
3. **Resource Name**: `search`
4. Click **Create Resource**

#### Create `/api/search/autocomplete` resource:
1. Select `/api/search`
2. Click **Actions** → **Create Resource**
3. **Resource Name**: `autocomplete`
4. Check **Enable API Gateway CORS**
5. Click **Create Resource**

### Step 3: Create Methods

#### For `/api/author/{name}`:

1. Select `/api/author/{name}` resource
2. Click **Actions** → **Create Method**
3. Select **GET** from dropdown
4. Click the checkmark ✓
5. Configure:
   - **Integration type**: Lambda Function
   - **Use Lambda Proxy integration**: ✓ (checked)
   - **Lambda Region**: Select your region (e.g., us-east-1)
   - **Lambda Function**: `get-author`
6. Click **Save**
7. Click **OK** to grant API Gateway permission to invoke Lambda

#### For `/api/authors/letter/{letter}`:

1. Select `/api/authors/letter/{letter}` resource
2. Click **Actions** → **Create Method**
3. Select **GET**
4. Click checkmark ✓
5. Configure:
   - **Integration type**: Lambda Function
   - **Use Lambda Proxy integration**: ✓
   - **Lambda Function**: `get-authors-by-letter`
6. Click **Save**
7. Click **OK**

#### For `/api/search/autocomplete`:

1. Select `/api/search/autocomplete` resource
2. Click **Actions** → **Create Method**
3. Select **GET**
4. Click checkmark ✓
5. Configure:
   - **Integration type**: Lambda Function
   - **Use Lambda Proxy integration**: ✓
   - **Lambda Function**: `search-autocomplete`
6. Click **Save**
7. Click **OK**

### Step 4: Enable CORS

For each resource with a method (`/api/author/{name}`, `/api/authors/letter/{letter}`, `/api/search/autocomplete`):

1. Select the resource
2. Click **Actions** → **Enable CORS**
3. Configure:
   - **Access-Control-Allow-Methods**: ✓ GET, ✓ OPTIONS
   - **Access-Control-Allow-Headers**:
     ```
     Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token
     ```
   - **Access-Control-Allow-Origin**: `*` (or your specific domain in production)
4. Click **Enable CORS and replace existing CORS headers**
5. Click **Yes, replace existing values**

### Step 5: Deploy API

1. Click **Actions** → **Deploy API**
2. **Deployment stage**: [New Stage]
3. **Stage name**: `prod`
4. **Stage description**: Production deployment
5. Click **Deploy**

### Step 6: Get Invoke URL

1. Go to **Stages** in left sidebar
2. Click on `prod` stage
3. Copy the **Invoke URL** at the top (e.g., `https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod`)

### Step 7: Update Frontend Configuration

Update `.env.local`:
```bash
VITE_API_BASE_URL=https://YOUR-API-ID.execute-api.YOUR-REGION.amazonaws.com/prod
```

Example:
```bash
VITE_API_BASE_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
```

---

## Method 2: AWS CLI (Advanced)

### Prerequisites

```bash
# Set variables
API_NAME="writers-almanac-api"
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
```

### Create API

```bash
# Create REST API
API_ID=$(aws apigateway create-rest-api \
  --name "$API_NAME" \
  --description "API for Writer's Almanac" \
  --endpoint-configuration types=REGIONAL \
  --query 'id' --output text)

echo "API ID: $API_ID"

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[0].id' --output text)

echo "Root ID: $ROOT_ID"
```

### Create Resources

```bash
# Create /api
API_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part api \
  --query 'id' --output text)

# Create /api/author
AUTHOR_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $API_RESOURCE_ID \
  --path-part author \
  --query 'id' --output text)

# Create /api/author/{name}
AUTHOR_NAME_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $AUTHOR_RESOURCE_ID \
  --path-part '{name}' \
  --query 'id' --output text)

# Similar for other resources...
```

### Create Methods and Integrations

```bash
# Create GET method for /api/author/{name}
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $AUTHOR_NAME_RESOURCE_ID \
  --http-method GET \
  --authorization-type NONE

# Integrate with Lambda
LAMBDA_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:get-author"

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $AUTHOR_NAME_RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"

# Grant permission
aws lambda add-permission \
  --function-name get-author \
  --statement-id apigateway-get-author \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*"
```

### Deploy API

```bash
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --description "Production deployment"

# Get invoke URL
echo "Invoke URL: https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
```

---

## Method 3: Infrastructure as Code (Recommended for Production)

### Option A: AWS SAM Template

Create `lambda/template.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Writer's Almanac API

Globals:
  Function:
    Runtime: nodejs18.x
    Timeout: 15
    Environment:
      Variables:
        S3_BUCKET: !Ref S3BucketName
        AWS_REGION: !Ref AWS::Region

Parameters:
  S3BucketName:
    Type: String
    Description: S3 bucket containing author data

Resources:
  WritersAlmanacApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Cors:
        AllowMethods: "'GET,OPTIONS'"
        AllowHeaders: "'Content-Type,Authorization'"
        AllowOrigin: "'*'"

  GetAuthorFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: get-author/
      Handler: index.handler
      MemorySize: 256
      Policies:
        - S3ReadPolicy:
            BucketName: !Ref S3BucketName
      Events:
        GetAuthor:
          Type: Api
          Properties:
            RestApiId: !Ref WritersAlmanacApi
            Path: /api/author/{name}
            Method: get

  GetAuthorsByLetterFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: get-authors-by-letter/
      Handler: index.handler
      MemorySize: 256
      Policies:
        - S3ReadPolicy:
            BucketName: !Ref S3BucketName
      Events:
        GetAuthors:
          Type: Api
          Properties:
            RestApiId: !Ref WritersAlmanacApi
            Path: /api/authors/letter/{letter}
            Method: get

  SearchAutocompleteFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: search-autocomplete/
      Handler: index.handler
      MemorySize: 512
      Policies:
        - S3ReadPolicy:
            BucketName: !Ref S3BucketName
      Events:
        Search:
          Type: Api
          Properties:
            RestApiId: !Ref WritersAlmanacApi
            Path: /api/search/autocomplete
            Method: get

Outputs:
  ApiUrl:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${WritersAlmanacApi}.execute-api.${AWS::Region}.amazonaws.com/prod'
```

Deploy:
```bash
sam build
sam deploy --guided
```

---

## Testing API Gateway

### Test via AWS Console

1. Go to API Gateway console
2. Select your API
3. Click on a method (e.g., GET under `/api/author/{name}`)
4. Click **Test** (lightning bolt icon)
5. Enter path parameters (e.g., `name`: `billy-collins`)
6. Click **Test**
7. Verify response

### Test via curl

```bash
# Get author
curl https://YOUR-API-ID.execute-api.YOUR-REGION.amazonaws.com/prod/api/author/billy-collins

# Get authors by letter
curl https://YOUR-API-ID.execute-api.YOUR-REGION.amazonaws.com/prod/api/authors/letter/B

# Search
curl "https://YOUR-API-ID.execute-api.YOUR-REGION.amazonaws.com/prod/api/search/autocomplete?q=billy&limit=10"
```

---

## Troubleshooting

### Issue: 502 Bad Gateway

**Cause**: Lambda function error or timeout

**Solution**:
1. Check Lambda CloudWatch logs
2. Verify Lambda has correct environment variables
3. Test Lambda function directly in Lambda console

### Issue: 403 Forbidden

**Cause**: API Gateway doesn't have permission to invoke Lambda

**Solution**:
```bash
aws lambda add-permission \
  --function-name FUNCTION-NAME \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com
```

### Issue: CORS errors

**Cause**: CORS not enabled or misconfigured

**Solution**:
1. Ensure CORS is enabled on resources
2. Verify Lambda returns CORS headers
3. Deploy API after CORS changes

### Issue: 404 Not Found

**Cause**: Resource path doesn't match request

**Solution**:
1. Verify resource paths in API Gateway
2. Check deployed stage
3. Ensure request URL matches exact path

---

## Security Best Practices

1. **Use Custom Domain**: Instead of API Gateway URL, use custom domain
2. **Enable API Keys**: For production, require API keys
3. **Rate Limiting**: Configure usage plans to prevent abuse
4. **WAF**: Add AWS WAF for additional security
5. **CloudWatch Alarms**: Monitor for errors and high latency
6. **Restrict CORS**: Change `AllowOrigin` from `*` to specific domain

---

## Cost Optimization

- **Caching**: Enable API Gateway caching for frequently accessed endpoints
- **CloudFront**: Put CloudFront in front of API Gateway
- **Reserved Concurrency**: For Lambda functions with predictable traffic

---

## Next Steps

1. Update `.env.local` with API Gateway URL
2. Test frontend integration
3. Monitor CloudWatch logs and metrics
4. Set up custom domain (optional)
5. Configure usage plans and API keys (production)

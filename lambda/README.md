# Lambda Functions - Deployment Guide

This directory contains AWS Lambda functions for The Writer's Almanac API.

## Lambda Functions

### 1. get-author
- **Path**: `lambda/get-author/`
- **Purpose**: Fetch individual author data by name/slug
- **Endpoint**: `GET /api/author/{name}`
- **Handler**: `index.handler`

### 2. get-authors-by-letter
- **Path**: `lambda/get-authors-by-letter/`
- **Purpose**: Fetch all authors starting with a specific letter
- **Endpoint**: `GET /api/authors/letter/{letter}`
- **Handler**: `index.handler`

### 3. search-autocomplete
- **Path**: `lambda/search-autocomplete/`
- **Purpose**: Search autocomplete for authors
- **Endpoint**: `GET /api/search/autocomplete?q={query}`
- **Handler**: `index.handler`

## Package Functions

Run the packaging script to create deployment packages:

```bash
cd lambda
chmod +x package-all.sh
./package-all.sh
```

This creates:
- `dist/get-author.zip`
- `dist/get-authors-by-letter.zip`
- `dist/search-autocomplete.zip`

## Manual Deployment

### Via AWS Console

1. Go to AWS Lambda console
2. Select the function
3. Go to "Code" tab
4. Click "Upload from" → ".zip file"
5. Select the corresponding zip file
6. Click "Save"

### Via AWS CLI

```bash
# Update get-author function
aws lambda update-function-code \
  --function-name get-author \
  --zip-file fileb://dist/get-author.zip

# Update get-authors-by-letter function
aws lambda update-function-code \
  --function-name get-authors-by-letter \
  --zip-file fileb://dist/get-authors-by-letter.zip

# Update search-autocomplete function
aws lambda update-function-code \
  --function-name search-autocomplete \
  --zip-file fileb://dist/search-autocomplete.zip
```

## Environment Variables

Each Lambda function requires the following environment variables:

### get-author
- `S3_BUCKET`: S3 bucket name (e.g., "writers-almanac-bucket")
- `AWS_REGION`: AWS region (e.g., "us-east-1")

### get-authors-by-letter
- `S3_BUCKET`: S3 bucket name
- `AWS_REGION`: AWS region

### search-autocomplete
- `S3_BUCKET`: S3 bucket name
- `AWS_REGION`: AWS region

Set these in the Lambda console under Configuration → Environment variables.

## Lambda Configuration

### Runtime
- **Node.js**: 18.x or later

### Memory
- **get-author**: 256 MB
- **get-authors-by-letter**: 256 MB
- **search-autocomplete**: 512 MB (higher due to caching)

### Timeout
- **get-author**: 10 seconds
- **get-authors-by-letter**: 10 seconds
- **search-autocomplete**: 15 seconds

### Execution Role

Create an IAM role with the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
    }
  ]
}
```

## Testing

### Via AWS Console

1. Go to Lambda function
2. Click "Test" tab
3. Create test event with appropriate payload
4. Click "Test"

#### Example Test Events

**get-author:**
```json
{
  "httpMethod": "GET",
  "pathParameters": {
    "name": "billy-collins"
  }
}
```

**get-authors-by-letter:**
```json
{
  "httpMethod": "GET",
  "pathParameters": {
    "letter": "B"
  }
}
```

**search-autocomplete:**
```json
{
  "httpMethod": "GET",
  "queryStringParameters": {
    "q": "billy",
    "limit": "10"
  }
}
```

### Via AWS CLI

```bash
# Test get-author
aws lambda invoke \
  --function-name get-author \
  --payload '{"pathParameters":{"name":"billy-collins"}}' \
  response.json

cat response.json

# Test get-authors-by-letter
aws lambda invoke \
  --function-name get-authors-by-letter \
  --payload '{"pathParameters":{"letter":"B"}}' \
  response.json

cat response.json

# Test search-autocomplete
aws lambda invoke \
  --function-name search-autocomplete \
  --payload '{"queryStringParameters":{"q":"billy","limit":"10"}}' \
  response.json

cat response.json
```

## API Gateway Integration

After deploying Lambda functions, integrate them with API Gateway:

### Create REST API

1. Go to API Gateway console
2. Create new REST API
3. Create resources and methods:
   - `/api/author/{name}` → GET → get-author Lambda
   - `/api/authors/letter/{letter}` → GET → get-authors-by-letter Lambda
   - `/api/search/autocomplete` → GET → search-autocomplete Lambda

### Enable CORS

For each method:
1. Select method → Actions → Enable CORS
2. Configure allowed origins: `*` or specific domain
3. Deploy API to stage (e.g., "prod")

### Get API Gateway URL

After deployment, note the Invoke URL:
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
```

Update `.env.local`:
```
VITE_API_BASE_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
```

## Monitoring

### CloudWatch Logs

View logs in CloudWatch:
- Log group: `/aws/lambda/get-author`
- Log group: `/aws/lambda/get-authors-by-letter`
- Log group: `/aws/lambda/search-autocomplete`

### Metrics

Monitor in CloudWatch Metrics:
- Invocations
- Duration
- Errors
- Throttles

## Troubleshooting

### Issue: Function times out

**Solution**: Increase timeout in Lambda configuration

### Issue: S3 access denied

**Solution**: Check IAM role has `s3:GetObject` and `s3:ListBucket` permissions

### Issue: CORS errors

**Solution**:
1. Ensure Lambda returns CORS headers
2. Enable CORS in API Gateway
3. Deploy API after changes

### Issue: 404 for existing authors

**Solution**:
1. Check S3 bucket has author files
2. Verify bucket name in environment variables
3. Check slug format matches S3 file names

## Dependencies

All functions use:
- `@aws-sdk/client-s3`: ^3.478.0

Automatically installed when running `package-all.sh`.

## Cost Optimization

- **Free Tier**: First 1 million requests/month free
- **Caching**: search-autocomplete uses in-memory caching to reduce S3 calls
- **Cold Starts**: Initial request may be slower; subsequent requests are fast

## Security

- **Environment Variables**: Never commit actual values
- **IAM Roles**: Use least-privilege principle
- **CORS**: Restrict origins in production if needed
- **Rate Limiting**: Consider API Gateway rate limiting

## Version History

- **v1.0** (2024-10-24): Initial Lambda functions created

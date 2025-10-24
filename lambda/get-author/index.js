/**
 * Lambda Function: Get Author
 *
 * Fetches author data from S3 by author name/slug
 *
 * Path Parameters:
 * - name: Author name (will be converted to slug format)
 *
 * Returns:
 * - 200: Author data
 * - 404: Author not found
 * - 500: Server error
 */

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Initialize S3 client
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Configuration
const BUCKET_NAME = process.env.S3_BUCKET || 'writers-almanac-bucket';
const AUTHORS_PREFIX = 'authors/by-name/';

/**
 * Convert author name to slug format
 * @param {string} name - Author name (e.g., "Billy Collins")
 * @returns {string} Slug (e.g., "billy-collins")
 */
function nameToSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '');      // Trim leading/trailing hyphens
}

/**
 * Get CORS headers
 * @returns {Object} CORS headers
 */
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}

/**
 * Create error response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @returns {Object} API Gateway response
 */
function errorResponse(statusCode, message, code) {
  return {
    statusCode,
    headers: getCorsHeaders(),
    body: JSON.stringify({
      message,
      status: statusCode,
      code,
      timestamp: new Date().toISOString(),
    }),
  };
}

/**
 * Fetch author data from S3
 * @param {string} slug - Author slug
 * @returns {Promise<Object>} Author data
 */
async function fetchAuthorFromS3(slug) {
  const key = `${AUTHORS_PREFIX}${slug}.json`;

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    const response = await s3Client.send(command);
    const bodyContents = await streamToString(response.Body);
    return JSON.parse(bodyContents);
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return null; // Author not found
    }
    throw error; // Re-throw other errors
  }
}

/**
 * Convert stream to string
 * @param {Stream} stream - Readable stream
 * @returns {Promise<string>} String contents
 */
async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

/**
 * Lambda handler
 * @param {Object} event - API Gateway event
 * @returns {Object} API Gateway response
 */
exports.handler = async (event) => {
  // Log request details (excluding sensitive headers)
  console.log('Request:', JSON.stringify({
    httpMethod: event.httpMethod,
    path: event.path,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters,
  }, null, 2));

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: '',
    };
  }

  try {
    // Extract author name from path parameters
    const authorName = event.pathParameters?.name;

    if (!authorName) {
      return errorResponse(400, 'Missing author name parameter', 'MISSING_PARAMETER');
    }

    // Convert to slug
    const slug = nameToSlug(authorName);

    if (!slug) {
      return errorResponse(400, 'Invalid author name', 'INVALID_NAME');
    }

    console.log(`Fetching author: ${authorName} (slug: ${slug})`);

    // Fetch author data from S3
    const authorData = await fetchAuthorFromS3(slug);

    if (!authorData) {
      return errorResponse(404, `Author not found: ${authorName}`, 'AUTHOR_NOT_FOUND');
    }

    // Return success response
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify(authorData),
    };
  } catch (error) {
    console.error('Error:', error);

    return errorResponse(
      500,
      'Internal server error',
      'INTERNAL_ERROR'
    );
  }
};

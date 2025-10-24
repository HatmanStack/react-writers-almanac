/**
 * Lambda Function: Get Authors by Letter
 *
 * Fetches all authors whose names start with a given letter
 *
 * Path Parameters:
 * - letter: Single uppercase letter A-Z
 *
 * Returns:
 * - 200: Authors list
 * - 400: Invalid letter
 * - 404: No authors for letter
 * - 500: Server error
 */

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Initialize S3 client
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Configuration
const BUCKET_NAME = process.env.S3_BUCKET || 'writers-almanac-bucket';
const AUTHORS_BY_LETTER_PREFIX = 'authors/by-letter/';

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
 * Validate letter parameter
 * @param {string} letter - Letter to validate
 * @returns {boolean} True if valid
 */
function isValidLetter(letter) {
  return /^[A-Z]$/.test(letter);
}

/**
 * Fetch authors by letter from S3
 * @param {string} letter - Letter (A-Z)
 * @returns {Promise<Object>} Authors data
 */
async function fetchAuthorsByLetterFromS3(letter) {
  const key = `${AUTHORS_BY_LETTER_PREFIX}${letter}.json`;

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
      return null; // No authors for this letter
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
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: '',
    };
  }

  try {
    // Extract letter from path parameters
    const letter = event.pathParameters?.letter?.toUpperCase();

    if (!letter) {
      return errorResponse(400, 'Missing letter parameter', 'MISSING_PARAMETER');
    }

    // Validate letter (must be A-Z)
    if (!isValidLetter(letter)) {
      return errorResponse(400, 'Invalid letter. Must be A-Z', 'INVALID_LETTER');
    }

    console.log(`Fetching authors for letter: ${letter}`);

    // Fetch authors data from S3
    const authorsData = await fetchAuthorsByLetterFromS3(letter);

    if (!authorsData) {
      return errorResponse(404, `No authors found for letter: ${letter}`, 'NO_AUTHORS_FOUND');
    }

    // Return success response
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify(authorsData),
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

/**
 * Shared Lambda Utilities
 *
 * Common functions used across all Lambda handlers:
 * - getCorsHeaders: Standard CORS response headers
 * - errorResponse: Formatted error response for API Gateway
 * - streamToString: Convert readable stream to UTF-8 string
 */

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
    'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
  };
}

/**
 * Create error response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} [headerOverrides] - Optional headers to merge/override
 * @returns {Object} API Gateway response
 */
function errorResponse(statusCode, message, code, headerOverrides) {
  return {
    statusCode,
    headers: {
      ...getCorsHeaders(),
      ...headerOverrides,
    },
    body: JSON.stringify({
      message,
      status: statusCode,
      code,
      timestamp: new Date().toISOString(),
    }),
  };
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

module.exports = {
  getCorsHeaders,
  errorResponse,
  streamToString,
};

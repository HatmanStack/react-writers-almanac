/**
 * Lambda Function: Search Autocomplete
 *
 * Search for authors and poems by query string
 *
 * Query Parameters:
 * - q: Search query (required)
 * - limit: Maximum results (default: 10, max: 50)
 *
 * Returns:
 * - 200: Search results
 * - 400: Missing or invalid query
 * - 500: Server error
 */

const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');

// Initialize S3 client
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Configuration
const BUCKET_NAME = process.env.S3_BUCKET || 'writers-almanac-bucket';
const AUTHORS_PREFIX = 'authors/by-name/';
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// In-memory cache for author names (cold start optimization)
let authorNamesCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

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
 * Convert slug back to display name (best effort)
 * @param {string} slug - Author slug (e.g., "billy-collins")
 * @returns {string} Display name (e.g., "Billy Collins")
 */
function slugToName(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Fetch all author slugs from S3
 * @returns {Promise<string[]>} Array of author slugs
 */
async function fetchAuthorSlugs() {
  // Check cache
  if (authorNamesCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_TTL) {
    console.log('Using cached author names');
    return authorNamesCache;
  }

  console.log('Fetching author names from S3');
  const slugs = [];
  let continuationToken = null;

  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: AUTHORS_PREFIX,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);

    if (response.Contents) {
      response.Contents.forEach(obj => {
        // Extract slug from key: authors/by-name/billy-collins.json -> billy-collins
        const key = obj.Key;
        if (key.endsWith('.json')) {
          const slug = key.replace(AUTHORS_PREFIX, '').replace('.json', '');
          slugs.push(slug);
        }
      });
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : null;
  } while (continuationToken);

  // Update cache
  authorNamesCache = slugs;
  cacheTimestamp = Date.now();

  console.log(`Fetched ${slugs.length} author slugs`);
  return slugs;
}

/**
 * Search authors by query
 * @param {string} query - Search query
 * @param {number} limit - Maximum results
 * @returns {Promise<Object[]>} Search results
 */
async function searchAuthors(query, limit) {
  const authorSlugs = await fetchAuthorSlugs();
  const queryLower = query.toLowerCase();

  // Search and rank results
  const matches = [];

  for (const slug of authorSlugs) {
    const displayName = slugToName(slug);
    const nameLower = displayName.toLowerCase();
    const slugLower = slug.toLowerCase();

    // Exact match
    if (nameLower === queryLower || slugLower === queryLower) {
      matches.push({
        type: 'author',
        name: displayName,
        slug: slug,
        score: 100,
      });
      continue;
    }

    // Starts with match
    if (nameLower.startsWith(queryLower)) {
      matches.push({
        type: 'author',
        name: displayName,
        slug: slug,
        score: 90,
      });
      continue;
    }

    // Word boundary match (e.g., "Collins" matches "Billy Collins")
    if (nameLower.includes(' ' + queryLower)) {
      matches.push({
        type: 'author',
        name: displayName,
        slug: slug,
        score: 80,
      });
      continue;
    }

    // Contains match
    if (nameLower.includes(queryLower)) {
      matches.push({
        type: 'author',
        name: displayName,
        slug: slug,
        score: 70,
      });
    }
  }

  // Sort by score (descending) and take top results
  matches.sort((a, b) => b.score - a.score);

  return matches.slice(0, limit).map(({ type, name, slug, score }) => ({
    type,
    name,
    slug,
    info: `Author`, // Could be enhanced with additional metadata
  }));
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
    // Extract query parameters
    const queryParams = event.queryStringParameters || {};
    const query = queryParams.q;
    const limitParam = queryParams.limit;

    if (!query) {
      return errorResponse(400, 'Missing query parameter "q"', 'MISSING_QUERY');
    }

    if (query.trim().length < 1) {
      return errorResponse(400, 'Query must be at least 1 character', 'QUERY_TOO_SHORT');
    }

    // Parse limit
    let limit = DEFAULT_LIMIT;
    if (limitParam) {
      limit = parseInt(limitParam, 10);
      if (isNaN(limit) || limit < 1) {
        limit = DEFAULT_LIMIT;
      }
      if (limit > MAX_LIMIT) {
        limit = MAX_LIMIT;
      }
    }

    console.log(`Searching for: "${query}" (limit: ${limit})`);

    // Search authors
    const results = await searchAuthors(query, limit);

    // Return search results
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        query,
        results,
        total: results.length,
      }),
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

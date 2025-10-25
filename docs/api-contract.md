# API Contract Documentation

## Overview

This document defines the API contract for The Writer's Almanac application. The API uses two different sources:
- **CloudFront CDN**: Static content (poems, author data) served from S3
- **API Gateway**: Dynamic endpoints powered by Lambda functions (search, author lookup)

## Base URLs

- **CDN Base URL**: `https://d3vq6af2mo7fcy.cloudfront.net`
- **API Base URL**: `https://placeholder-api-gateway.amazonaws.com/prod` (to be updated)

---

## Endpoints

### 1. Get Daily Poem

Fetch the daily poem content for a specific date.

**Endpoint**: `GET /public/{date}.json`
**Base**: CloudFront CDN
**Full URL**: `https://d3vq6af2mo7fcy.cloudfront.net/public/{date}.json`

**Path Parameters**:
- `date` (string, required): Date in YYYYMMDD format (e.g., "20240101")

**Response**: `Poem` object

```typescript
{
  dayofweek: string;      // "Monday"
  date: string;           // "January 1, 2024"
  transcript: string;     // Full transcript
  poemtitle: string[];    // ["Poem Title"]
  poembyline: string;     // Subtitle
  author: string[];       // ["Author Name"]
  poem: string[];         // Poem lines
  notes: string[];        // Additional notes
}
```

**Status Codes**:
- `200 OK`: Success
- `404 Not Found`: Date not available
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl https://d3vq6af2mo7fcy.cloudfront.net/public/20240101.json
```

---

### 2. Get Poem Audio

Fetch the audio file for a daily reading.

**Endpoint**: `GET /public/{date}.mp3`
**Base**: CloudFront CDN
**Full URL**: `https://d3vq6af2mo7fcy.cloudfront.net/public/{date}.mp3`

**Path Parameters**:
- `date` (string, required): Date in YYYYMMDD format

**Response**: Audio file (arraybuffer)

**Notes**:
- Audio only available for dates after **2009-01-11** (20090111)
- Returns 404 for earlier dates

**Status Codes**:
- `200 OK`: Success
- `404 Not Found`: Audio not available

---

### 3. Get Author

Fetch detailed author information.

**Endpoint**: `GET /api/author/{slug}`
**Base**: API Gateway
**Full URL**: `https://placeholder-api-gateway.amazonaws.com/prod/api/author/{slug}`

**Path Parameters**:
- `slug` (string, required): Author name in slug format (lowercase, hyphens)
  - Example: "billy-collins", "mary-oliver", "a-a-milne"

**Response**: `Author` object

```typescript
{
  "poets.org"?: AuthorSource | "NotAvailable";
  "poetry foundation"?: {
    poet_meta_data: {
      lifetime: string;
      website: string;
    };
    biography: string;
    photo: string | "NotAvailable";
    poems: string | "NotAvailable";
    source: "Poetry Foundation";
    url: string;
  };
  "all poetry"?: AuthorSource | "NotAvailable";
  "wikipedia"?: AuthorSource;
}
```

**Status Codes**:
- `200 OK`: Success
- `404 Not Found`: Author not found
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl https://api-gateway-url/api/author/billy-collins
```

---

### 4. Get Authors by Letter

Fetch all authors whose names start with a specific letter.

**Endpoint**: `GET /api/authors/letter/{letter}`
**Base**: API Gateway
**Full URL**: `https://placeholder-api-gateway.amazonaws.com/prod/api/authors/letter/{letter}`

**Path Parameters**:
- `letter` (string, required): Single uppercase letter A-Z

**Response**: `AuthorsByLetter` object

```typescript
{
  letter: string;        // "A"
  authors: string[];     // ["A. A. Milne", "Anna Akhmatova", ...]
}
```

**Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Invalid letter
- `404 Not Found`: No authors for letter
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl https://api-gateway-url/api/authors/letter/B
```

---

### 5. Search Autocomplete

Search for authors and poems by query string.

**Endpoint**: `GET /api/search/autocomplete`
**Base**: API Gateway
**Full URL**: `https://placeholder-api-gateway.amazonaws.com/prod/api/search/autocomplete`

**Query Parameters**:
- `q` (string, required): Search query
- `limit` (number, optional): Maximum results (default: 10, max: 50)

**Response**: `SearchResponse` object

```typescript
{
  query: string;         // Original query
  results: [
    {
      type: "author" | "poem";
      name: string;      // Display name
      slug: string;      // Lookup identifier
      info?: string;     // Additional context
    }
  ];
  total: number;         // Total matches found
}
```

**Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Missing or invalid query
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl "https://api-gateway-url/api/search/autocomplete?q=billy&limit=10"
```

---

## Error Response Format

All API endpoints return errors in a standard format:

```typescript
{
  message: string;       // Human-readable error message
  status: number;        // HTTP status code
  code?: string;         // Error code (e.g., "AUTHOR_NOT_FOUND")
  details?: object;      // Additional error context
  timestamp: string;     // ISO 8601 timestamp
}
```

**Example Error Response**:
```json
{
  "message": "Author not found",
  "status": 404,
  "code": "AUTHOR_NOT_FOUND",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## CORS Configuration

All API Gateway endpoints must have CORS enabled:

**Development Headers**:
- `Access-Control-Allow-Origin`: `*`
- `Access-Control-Allow-Methods`: `GET, OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type`

**Production Headers** (Recommended):
- `Access-Control-Allow-Origin`: Use allowlist of approved domains, echo the `Origin` header for allowed domains
- `Access-Control-Allow-Methods`: Restrict to only needed methods (typically just `GET, OPTIONS`)
- `Access-Control-Allow-Headers`: Restrict to only needed headers (avoid `Authorization` unless required)
- `Access-Control-Allow-Credentials`: Only set to `true` if using cookies or authentication
- `Vary: Origin`: Required when echoing Origin header for proper caching

**Security Notes**:
- Never use `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`
- Restrict allowed methods and headers to minimum required for each endpoint
- Use specific origin allowlist rather than wildcard in production

---

## Caching Strategy

### CloudFront CDN
- **Daily Poems**: `Cache-Control: public, max-age=31536000` (1 year - immutable)
- **Audio Files**: `Cache-Control: public, max-age=31536000` (1 year - immutable)

### API Gateway
- **Author Lookup**: Cache for 24 hours (TanStack Query)
- **Authors by Letter**: Cache for 24 hours (TanStack Query)
- **Search**: Cache for 1 hour (TanStack Query with debouncing)

---

## Rate Limiting

API Gateway endpoints should implement rate limiting:
- **Default**: 100 requests per minute per IP
- **Burst**: 200 requests

---

## Data Formats

### Date Format
- **YYYYMMDD**: `20240101` (January 1, 2024)
- Used for poem lookups and audio files

### Slug Format
- **Lowercase with hyphens**: `billy-collins`
- Conversion: `"Billy Collins" → "billy-collins"`
- Remove special characters, convert spaces to hyphens

---

## TypeScript Type Definitions

All types are defined in:
- `src/types/poem.ts` - Poem-related types
- `src/types/author.ts` - Author-related types
- `src/types/api.ts` - API request/response types

Import types:
```typescript
import { Poem, PoemParams } from '@/types/poem';
import { Author, AuthorParams } from '@/types/author';
import { ApiResponse, ApiError, SearchResponse } from '@/types/api';
```

---

## Version History

- **v1.0** (2024-10-24): Initial API contract definition

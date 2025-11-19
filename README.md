# The Writer's Almanac

A modern React application delivering daily poems and historical narratives, featuring audio narration by Garrison Keillor and AI-generated transcripts.

**Live Demo**: [https://d6d8ny9p8jhyg.cloudfront.net](https://d6d8ny9p8jhyg.cloudfront.net)

---

## About

This is a modernized version of The Writer's Almanac, rebuilt with current web technologies. The code is provided here for transparency and as a portfolio demonstration. The content (poems, audio, historical narratives) is hosted privately and is the property of Prairie Home Productions.

---

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool
- **Zustand** - State management
- **TanStack Query** - Server state & caching
- **Material-UI** - Component library
- **Tailwind CSS** - Styling
- **Vitest** - Unit testing
- **Playwright** - E2E testing

### Backend
- **AWS Lambda** - Serverless API (Node.js 18)
- **AWS SAM** - Infrastructure as Code
- **API Gateway** - REST API endpoints
- **S3** - Content storage
- **CloudFront** - CDN

---

## Features

- Daily poems and historical events
- Audio narration with AI transcripts
- Author biographies from Poetry Foundation
- Search with autocomplete
- Date navigation and calendar picker
- Responsive design
- Animated particle effects

---

## Development

### Frontend Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build
```

### Backend Development

The backend uses AWS SAM for automated Lambda deployment:

```bash
# Deploy Lambda functions and API Gateway
cd lambda
sam build && sam deploy

# Test API locally (requires Docker)
sam local start-api
```

See [`lambda/README.md`](lambda/README.md) for detailed deployment instructions.

---

## Project Structure

```text
src/
├── api/              # API client and endpoints
├── components/       # React components
├── hooks/            # Custom React hooks
├── store/            # Zustand state management
├── types/            # TypeScript definitions
└── utils/            # Utility functions

lambda/
├── get-author/       # Lambda: Fetch author data
├── get-authors-by-letter/  # Lambda: Authors by letter
├── search-autocomplete/    # Lambda: Search API
├── template.yaml     # SAM infrastructure definition
├── samconfig.toml    # SAM deployment configuration
└── events/           # Test events for local testing

tests/
└── e2e/              # Playwright E2E tests

docs/
├── SAM_DEPLOYMENT.md # Detailed SAM documentation
└── plans/            # Implementation plans
```

---

## Notes for Developers

This codebase demonstrates:
- Modern React patterns (hooks, lazy loading, memoization)
- Type-safe development with strict TypeScript (zero `any` types)
- Comprehensive testing (75%+ coverage)
- Performance optimization (code splitting, virtualization)
- Accessibility compliance (WCAG AA)
- Security best practices (DOMPurify sanitization)

The application uses AWS infrastructure:
- **S3**: Stores daily poems, author data, and audio files (not managed by this repo)
- **Lambda + API Gateway**: Managed via AWS SAM (see `lambda/` directory)
- **CloudFront**: CDN for content delivery (not managed by this repo)

---

## Debugging

### Transcript Debugging

If transcript content is not loading or displaying correctly, enable debug mode:

**Enable debug mode:**
```javascript
// In browser console:
localStorage.setItem('DEBUG_TRANSCRIPT', 'true')
// Then reload the page
```

**Check debug output:**
- Open browser DevTools Console tab
- Look for messages prefixed with `[Transcript Debug]` or `[Transcript Metrics]`
- Debug messages show transcript data flow through the application

**Debug messages include:**
- `[Transcript Debug] Poem data received` - Shows if transcript in API response
- `[Transcript Debug] Setting to store` - Shows if transcript sent to Zustand store
- `[App] No transcript available for date: YYYYMMDD` - Identifies dates without transcripts
- `[Transcript Metrics]` - Shows transcript quality metrics (length, word count)

**Disable debug mode:**
```javascript
// In browser console:
localStorage.removeItem('DEBUG_TRANSCRIPT')
```

**Alternative: Enable via environment variable**
```bash
# In .env file:
VITE_DEBUG=true
```

**Note:** Debug mode only works in development builds, not in production.

---

## License

**Code**: MIT License

**Content**: All poems, historical narratives, and audio recordings are the property of **Prairie Home Productions** and may not be reproduced without permission.

---

## Acknowledgments

- **Garrison Keillor** - Creator of The Writer's Almanac
- **Prairie Home Productions** - Content provider
- **Poetry Foundation** - Author biographies
- **OpenAI Whisper** - Audio transcription

---

**Version**: 0.1.0 | **Last Updated**: 2025-10-24

<div align="center">

![Writer's Alamanac Banner](frontend/public/og-image.jpg)

A modern React application delivering daily poems and historical narratives, featuring audio narration by Garrison Keillor and AI-generated transcripts.

**Live Demo**: [The Writer's Almanac](https://writer.hatstack.fun)

---

</div>

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

- **AWS Lambda** - Serverless API (Node.js 22)
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
cd backend
sam build && sam deploy

# Test API locally (requires Docker)
sam local start-api
```

See [`backend/README.md`](backend/README.md) for detailed deployment instructions.

---

## Project Structure

```text
frontend/src/
├── api/              # API client and endpoints
├── assets/           # Static assets
├── components/       # React components
│   ├── ui/           # Reusable UI components
│   ├── PoemDates/    # Date navigation components
│   └── SEOHead/      # SEO meta components
├── hooks/            # Custom React hooks
├── store/            # Zustand state management
├── types/            # TypeScript definitions
└── utils/            # Utility functions

backend/
├── lambdas/
│   ├── get-author/          # Lambda: Fetch author data
│   ├── get-authors-by-letter/  # Lambda: Authors by letter
│   ├── search-autocomplete/    # Lambda: Search API
│   └── shared/              # Shared Lambda utilities
├── scripts/          # Deployment scripts
├── template.yaml     # SAM infrastructure definition
└── samconfig.toml    # SAM deployment configuration

tests/
└── e2e/              # Playwright E2E tests
```

---

## Notes for Developers

This codebase demonstrates:

- Modern React patterns (hooks, lazy loading, memoization)
- Type-safe development with strict TypeScript (zero `any` types)
- Testing with coverage enforcement
- Performance optimization (code splitting, virtualization)
- Accessibility testing with vitest-axe
- Security best practices (DOMPurify sanitization)

The application uses AWS infrastructure:

- **S3**: Stores daily poems, author data, and audio files (not managed by this repo)
- **Lambda + API Gateway**: Managed via AWS SAM (see `backend/` directory)
- **CloudFront**: CDN for content delivery (not managed by this repo)

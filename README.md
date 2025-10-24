# The Writer's Almanac

A modern React application delivering daily poems and historical narratives, featuring audio narration by Garrison Keillor and AI-generated transcripts.

**Live Demo**: [https://d6d8ny9p8jhyg.cloudfront.net](https://d6d8ny9p8jhyg.cloudfront.net)

---

## About

This is a modernized version of The Writer's Almanac, rebuilt with current web technologies. The code is provided here for transparency and as a portfolio demonstration. The content (poems, audio, historical narratives) is hosted privately and is the property of Prairie Home Productions.

---

## Tech Stack

- **React 18** with TypeScript
- **Vite** - Build tool
- **Zustand** - State management
- **TanStack Query** - Server state & caching
- **Material-UI** - Component library
- **Tailwind CSS** - Styling
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **AWS** - Hosting (CloudFront + S3)

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

---

## Project Structure

```
src/
├── api/              # API client and endpoints
├── components/       # React components
├── hooks/            # Custom React hooks
├── store/            # Zustand state management
├── types/            # TypeScript definitions
└── utils/            # Utility functions

tests/
└── e2e/              # Playwright E2E tests
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

The data layer expects AWS infrastructure (S3 for content, API Gateway for author data) which is not included in this repository.

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

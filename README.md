# The Writers Almanac

A modern, performant single-page web application built with React that delivers daily poems and historical narratives. Features audio narration by Garrison Keillor, AI-generated transcripts, and a rich interactive experience for exploring poetry and history.

**Live Demo**: [https://d6d8ny9p8jhyg.cloudfront.net](https://d6d8ny9p8jhyg.cloudfront.net)
**Original**: [The Writers Almanac Archive](https://www.writersalmanac.org)

---

## Features

- **Daily Content**: Poems and historical events for each day of the year
- **Audio Narration**: Garrison Keillor's voice narrating history and poetry
- **AI Transcripts**: OpenAI Whisper-generated transcriptions for accessibility
- **Author Bios**: Comprehensive author information from Poetry Foundation
- **Search**: Fast autocomplete search for authors and poems
- **Date Navigation**: Browse content by any date in the archive
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Particle Effects**: Beautiful animated background with tsparticles
- **Performance Optimized**: Code splitting, lazy loading, and sub-2s load times

---

## Tech Stack

### Core Technologies
- **React 18.2** - UI framework with hooks and concurrent features
- **TypeScript 5.9** - Type-safe JavaScript
- **Vite 7.1** - Lightning-fast build tool and dev server
- **Zustand 5.0** - Lightweight state management
- **TanStack Query 5.90** - Server state management and caching

### UI & Styling
- **Material-UI 5.18** - Component library
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Emotion** - CSS-in-JS for Material-UI styling
- **tsparticles** - Animated particle effects

### Development Tools
- **Vitest 4.0** - Unit testing framework
- **Playwright 1.56** - End-to-end testing
- **ESLint 8.57** - Linting and code quality
- **Prettier 3.6** - Code formatting
- **Husky** - Git hooks for pre-commit quality checks

### Performance
- **React.lazy** - Component code splitting
- **@tanstack/react-virtual** - Virtualized lists for large datasets
- **web-vitals** - Performance monitoring (LCP, FID, CLS)
- **Bundle analyzer** - Webpack bundle visualization

---

## Prerequisites

- **Node.js**: v22.20.0 or higher (via nvm recommended)
- **npm**: 9.0 or higher (comes with Node.js)
- **AWS Account**: For deployment (optional for local development)
- **OpenAI API Key**: Only needed if regenerating audio transcripts

---

## Installation

```bash
# Clone the repository
git clone https://github.com/hatmanstack/react-writers-almanac.git
cd react-writers-almanac

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Development
VITE_API_BASE_URL=https://your-api-gateway-url.amazonaws.com
VITE_CDN_BASE_URL=https://your-cloudfront-distribution.cloudfront.net

# AWS Configuration (for deployment)
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id

# OpenAI (optional - only for transcript regeneration)
OPENAI_API_KEY=your-openai-api-key
```

---

## Development Commands

```bash
# Start dev server (hot reload on http://localhost:5173)
npm run dev

# Run TypeScript type checking
npm run typecheck

# Run linting
npm run lint

# Format code with Prettier
npm run format

# Run unit tests
npm test

# Run unit tests with UI
npm test:ui

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# View E2E test report
npm run test:e2e:report
```

---

## Building & Deployment

### Local Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
# Opens on http://localhost:4173
```

### AWS Deployment

The app is deployed on AWS using CloudFront + S3:

#### AWS Architecture
```
┌─────────────────┐
│ CloudFront CDN  │ ← Main entry point
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────────┐
│ S3     │ │ API Gateway│
│ Static │ │ + Lambda   │
│ Assets │ │ (Authors)  │
└────────┘ └────────────┘
```

#### Deployment Steps

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Configure AWS CLI** (if not already done):
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Default region: us-east-1
   # Default output format: json
   ```

3. **Deploy to S3**:
   ```bash
   aws s3 sync build/ s3://your-bucket-name --delete
   ```

4. **Invalidate CloudFront cache**:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id YOUR_DISTRIBUTION_ID \
     --paths "/*"
   ```

#### AWS Resources Required

1. **S3 Bucket** (Static hosting)
   - Bucket policy allowing CloudFront access
   - Versioning enabled (recommended)
   - Structure:
     ```
     s3://your-bucket/
     ├── index.html
     ├── assets/
     │   ├── *.js (JavaScript bundles)
     │   ├── *.css (Stylesheets)
     │   └── *.png (Images)
     └── public/
         ├── YYYYMMDD.json (Poem data)
         └── YYYYMMDD.mp3 (Audio files)
     ```

2. **CloudFront Distribution**
   - Origin: S3 bucket
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Compress Objects: Yes
   - Cache Policy: CachingOptimized
   - Custom error pages: 403 → /index.html (SPA routing)

3. **API Gateway + Lambda** (for author data)
   - Endpoint: `/api/author/{slug}`
   - Lambda: Fetch author bio from DynamoDB or S3
   - CORS enabled

4. **DynamoDB** (optional, for author bios)
   - Table: `authors`
   - Primary Key: `slug` (String)

---

## Project Structure

```
react-writers-almanac/
├── src/
│   ├── api/                 # API client and endpoints
│   │   ├── client.ts        # Axios instance
│   │   ├── endpoints.ts     # API endpoint definitions
│   │   └── queryClient.ts   # TanStack Query configuration
│   ├── assets/              # Static assets
│   │   ├── images/          # PNG images
│   │   ├── Authors_sorted.js
│   │   └── Poems_sorted.js
│   ├── components/
│   │   ├── Audio/           # Audio player component
│   │   ├── Author/          # Author bio component (virtualized)
│   │   ├── ErrorBoundary/   # Error boundary wrapper
│   │   ├── Note/            # Note/commentary component
│   │   ├── Particles/       # Background particle effects
│   │   ├── ui/              # Reusable UI components
│   │   ├── Poem.tsx         # Poem display component
│   │   └── Search.tsx       # Search + date picker
│   ├── hooks/
│   │   └── queries/         # TanStack Query hooks
│   ├── store/               # Zustand state management
│   │   ├── slices/          # Store slices
│   │   ├── types.ts         # Store type definitions
│   │   └── useAppStore.ts   # Main store
│   ├── test/                # Test setup and utilities
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   │   ├── date.ts          # Date formatting
│   │   ├── performance.ts   # Web Vitals tracking
│   │   ├── sanitize.ts      # HTML sanitization
│   │   └── string.ts        # String utilities
│   ├── App.tsx              # Main app component
│   ├── index.css            # Global styles + Tailwind
│   ├── main.tsx             # App entry point
│   └── vite-env.d.ts        # Vite type declarations
├── tests/
│   └── e2e/                 # Playwright E2E tests
├── docs/                    # Documentation
├── public/                  # Public assets (not processed by Vite)
├── .eslintrc.cjs            # ESLint configuration
├── .prettierrc              # Prettier configuration
├── playwright.config.ts     # Playwright configuration
├── postcss.config.js        # PostCSS + Tailwind configuration
├── tailwind.config.js       # Tailwind theme configuration
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
├── vitest.config.ts         # Vitest configuration
└── package.json             # Dependencies and scripts
```

---

## Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Coverage thresholds:
# - Overall: >50%
# - Critical paths: >60%
```

**Test Files**: `*.test.tsx`, `*.test.ts` (colocated with source files)

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run all E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/search.spec.ts

# View last test report
npm run test:e2e:report
```

**Test Coverage**:
- Search flow (autocomplete, selection)
- Date navigation (calendar, prev/next buttons)
- Audio playback (play, pause, transcript)
- Author bio display (virtualized lists)
- Error handling (404, network errors)
- Responsive design (mobile, tablet, desktop)

---

## Development Workflow

### Git Workflow

This project uses **git worktrees** for parallel development:

```bash
# Create a new worktree for a feature
git worktree add ../feature-name branch-name

# Work in the worktree
cd ../feature-name

# When done, remove the worktree
git worktree remove ../feature-name
```

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `test:` - Adding or updating tests
- `docs:` - Documentation changes
- `style:` - Code formatting (no logic change)
- `chore:` - Maintenance tasks

**Pre-commit Hooks** (via Husky + lint-staged):
- ESLint with `--max-warnings=0` (zero warnings policy)
- Prettier formatting
- TypeScript type checking (on push)

### Code Quality Standards

- **Zero ESLint warnings**: All code must pass ESLint with no warnings
- **Zero TypeScript errors**: Strict type checking enabled
- **Zero `any` types**: All types must be explicit (no `any`)
- **Test coverage**: >50% overall, >60% for critical paths
- **Accessibility**: All components tested with vitest-axe
- **Performance**: Web Vitals targets (LCP <2.5s, FID <100ms, CLS <0.1)

---

## AWS Setup Details

### S3 Bucket Configuration

1. Create bucket:
   ```bash
   aws s3 mb s3://your-bucket-name --region us-east-1
   ```

2. Enable static website hosting:
   ```bash
   aws s3 website s3://your-bucket-name \
     --index-document index.html \
     --error-document index.html
   ```

3. Bucket policy (for CloudFront access):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "CloudFrontAccess",
         "Effect": "Allow",
         "Principal": {
           "Service": "cloudfront.amazonaws.com"
         },
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*",
         "Condition": {
           "StringEquals": {
             "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
           }
         }
       }
     ]
   }
   ```

### CloudFront Distribution

1. Create distribution:
   - Origin Domain: `your-bucket-name.s3.us-east-1.amazonaws.com`
   - Origin Access: Origin Access Control (OAC)
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD, OPTIONS
   - Cache Policy: CachingOptimized
   - Compress Objects: Yes

2. Custom error responses:
   ```
   404 → /index.html (200 response) - SPA routing
   403 → /index.html (200 response) - S3 access denied
   ```

3. SSL Certificate: Use default CloudFront certificate or custom ACM cert

### API Gateway + Lambda

1. Create Lambda function for author data:
   ```javascript
   // Lambda handler
   exports.handler = async (event) => {
     const slug = event.pathParameters.slug;
     // Fetch from DynamoDB or S3
     const author = await getAuthorData(slug);
     return {
       statusCode: 200,
       headers: {
         'Access-Control-Allow-Origin': '*',
         'Content-Type': 'application/json'
       },
       body: JSON.stringify(author)
     };
   };
   ```

2. Create API Gateway REST API:
   - Resource: `/api/author/{slug}`
   - Method: GET
   - Integration: Lambda proxy
   - CORS: Enabled

3. Deploy API and note the invoke URL

---

## Troubleshooting

### Build Issues

**Problem**: `npm install` fails with peer dependency conflicts
**Solution**:
```bash
npm install --legacy-peer-deps
```

**Problem**: `npm run build` fails with "out of memory"
**Solution**:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

**Problem**: Vite build fails with PostCSS/Tailwind error
**Solution**:
```bash
# Ensure Tailwind CSS v3 is installed (not v4)
npm install --save-dev tailwindcss@^3.4.18 postcss autoprefixer
```

### Development Server Issues

**Problem**: Dev server won't start on port 5173
**Solution**:
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
npm run dev
```

**Problem**: Hot reload not working
**Solution**:
- Check if files are being watched (may need to increase file watch limit)
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Testing Issues

**Problem**: E2E tests fail with "browser not installed"
**Solution**:
```bash
npx playwright install chromium
```

**Problem**: Unit tests fail with "Cannot find module"
**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Coverage reports missing
**Solution**:
```bash
# Ensure @vitest/coverage-v8 is installed
npm install --save-dev @vitest/coverage-v8
npm run test:coverage
```

### Runtime Issues

**Problem**: App shows blank page in production
**Solution**:
- Check browser console for errors
- Verify CloudFront error pages are configured (404 → /index.html)
- Check that all environment variables are set correctly

**Problem**: Audio files won't play
**Solution**:
- Check CORS headers on S3/CloudFront
- Verify audio file URLs are correct in browser Network tab
- Ensure CloudFront is serving from correct origin

**Problem**: Search autocomplete not working
**Solution**:
- Check API Gateway endpoint is accessible
- Verify CORS is enabled on API Gateway
- Check browser Network tab for API call failures

### AWS Deployment Issues

**Problem**: CloudFront distribution shows 403 errors
**Solution**:
- Check S3 bucket policy allows CloudFront access
- Verify Origin Access Control (OAC) is configured
- Ensure default root object is set to `index.html`

**Problem**: CSS/JS files not loading after deployment
**Solution**:
- Check that `build/` directory was synced correctly to S3
- Verify CloudFront cache hasn't retained old files (invalidate cache)
- Check Content-Type headers on S3 objects

**Problem**: SPA routing breaks (page refresh shows 404)
**Solution**:
- Add CloudFront custom error response: 403/404 → /index.html (200)

---

## Performance Optimization

The app is highly optimized for performance:

### Code Splitting
- Lazy-loaded components: Audio, Author, Particles
- Manual chunk splitting for vendor libraries
- Tree-shaking for unused code elimination

### Bundle Sizes (gzipped)
- Main bundle: ~156 KB
- React vendor: ~46 KB
- Material-UI vendor: ~87 KB
- Particles vendor: ~40 KB
- Total initial load: ~369 KB

### Performance Metrics (Lighthouse)
- **Performance Score**: >90
- **LCP (Largest Contentful Paint)**: <2.5s
- **FID (First Input Delay)**: <100ms
- **CLS (Cumulative Layout Shift)**: <0.1
- **TTFB (Time to First Byte)**: <800ms (depends on hosting)

### Optimization Features
- React.memo on all presentational components
- useMemo for expensive computations
- useCallback for event handlers
- Virtual scrolling for long lists (>50 items)
- Image lazy loading (below-fold images)
- Web Vitals monitoring in development

---

## Accessibility

The app is designed with accessibility in mind:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: Semantic HTML and ARIA labels
- **Focus Management**: Clear focus indicators and logical tab order
- **Color Contrast**: WCAG AA compliant
- **Responsive Text**: Scalable font sizes
- **Audio Transcripts**: Full transcripts available for all audio

**Testing**: All components pass vitest-axe accessibility tests.

---

## License

The code for this project is licensed under the **MIT License**.

**Content License**: All poems, historical narratives, and audio recordings are the property of **Prairie Home Productions** and are used with permission. Content may not be reproduced without express written consent.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test && npm run test:e2e`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

**Code Standards**: All contributions must pass ESLint (zero warnings), TypeScript (zero errors), and maintain test coverage.

---

## Acknowledgments

- **Garrison Keillor** - Original creator of The Writers Almanac
- **Prairie Home Productions** - Content provider
- **Poetry Foundation** - Author biographies
- **OpenAI Whisper** - Audio transcription

---

## Support

For issues, questions, or contributions:
- **GitHub Issues**: [https://github.com/hatmanstack/react-writers-almanac/issues](https://github.com/hatmanstack/react-writers-almanac/issues)
- **Original Project**: [The Writers Almanac](https://www.writersalmanac.org)

---

**Last Updated**: 2025-10-24 | **Version**: 0.1.0

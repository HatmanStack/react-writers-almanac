# React Writers Almanac - Feature Implementation Plan

## Feature Overview

This implementation plan covers three integrated improvements to the React Writers Almanac application, prioritized to build on each other for maximum stability and maintainability.

**Priority 1: SAM Automated Deployment** - Modernize the Lambda deployment infrastructure by implementing AWS SAM (Serverless Application Model) for automated, reproducible deployments. This replaces the current manual ZIP upload process with a single-command deployment workflow that manages both Lambda functions and API Gateway configuration, while integrating seamlessly with existing S3 and CloudFront resources.

**Priority 2: Test Coverage Improvement** - Strengthen the testing foundation by running comprehensive coverage analysis to identify gaps in the existing test suite, then systematically adding unit tests for under-tested components. This ensures new features and fixes are built on a solid, well-tested codebase.

**Priority 3: Transcript Content Loading Fix** - Investigate and resolve the issue where the transcript button toggles visibility correctly but the actual transcript content fails to load or display. This requires tracing the data flow from S3 daily JSON files through the TanStack Query layer, Zustand store, and React component rendering to identify and fix the broken link in the chain.

## Prerequisites

### Required Tools
- **AWS SAM CLI** (v1.100.0+) - Install: `brew install aws-sam-cli` or see [AWS SAM Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- **AWS CLI** (v2.13.0+) - For AWS credentials and deployment
- **Node.js** (v18.x) - Current project runtime
- **npm** (v9.0.0+) - Package manager

### AWS Configuration
- AWS credentials configured (`aws configure` or environment variables)
- IAM permissions for:
  - Lambda function creation/update
  - API Gateway management
  - CloudFormation stack operations
  - S3 read access (existing bucket)
  - CloudWatch Logs

### Environment Setup
- Existing `.env` file with:
  - `VITE_API_BASE_URL` - API Gateway endpoint
  - `VITE_CDN_BASE_URL` - CloudFront distribution URL
  - `VITE_S3_BUCKET` - S3 bucket name
  - `VITE_AWS_REGION` - AWS region (e.g., us-east-1)

### Repository State
- Current branch: `claude/design-new-feature-01SJt8Xs8ZfG9foLfshCCGsK`
- Clean working directory (all changes committed)
- All existing tests passing (`npm test` and `npm run test:e2e`)

## Phase Summary

| Phase | Goal | Estimated Tokens | Dependencies |
|-------|------|-----------------|--------------|
| **Phase 0** | [Foundation - Architecture & Conventions](./Phase-0.md) | N/A (Reference) | None |
| **Phase 1** | [SAM Automated Deployment Infrastructure](./Phase-1.md) | ~75,000 | Phase 0 |
| **Phase 2** | [Test Coverage Analysis & Improvement](./Phase-2.md) | ~65,000 | Phase 1 complete |
| **Phase 3** | [Transcript Content Loading Fix](./Phase-3.md) | ~50,000 | Phase 2 complete |

**Total Estimated Tokens**: ~190,000

## Navigation

### Foundation
- [Phase 0: Architecture Decisions & Conventions](./Phase-0.md)
  - SAM template design patterns
  - Testing strategy and patterns
  - Git commit conventions
  - Common pitfalls and solutions

### Implementation Phases
- [Phase 1: SAM Automated Deployment](./Phase-1.md)
  - Create SAM template for Lambda + API Gateway
  - Configure build and deployment scripts
  - Test local development with SAM Local
  - Deploy and verify production deployment

- [Phase 2: Test Coverage Improvement](./Phase-2.md)
  - Run comprehensive coverage analysis
  - Identify under-tested components and utilities
  - Write unit tests to achieve 85%+ coverage
  - Update CI/CD for coverage enforcement

- [Phase 3: Transcript Content Loading Fix](./Phase-3.md)
  - Investigate transcript data source and flow
  - Identify broken link in data pipeline
  - Implement fix with proper error handling
  - Add tests for transcript rendering

## Development Workflow

Each phase follows a consistent workflow:

1. **Read Phase 0** - Review architectural decisions and conventions
2. **Read Phase N** - Understand current phase goals and tasks
3. **Implement tasks sequentially** - Each task has prerequisites and verification
4. **Test continuously** - Run tests after each task
5. **Commit atomically** - Use conventional commit messages
6. **Verify phase completion** - Run phase verification checklist
7. **Proceed to next phase** - Only when current phase is complete

## Success Criteria

### Phase 1 Success
- ✅ SAM template deploys Lambda functions and API Gateway successfully
- ✅ `sam deploy` works with single command
- ✅ All existing Lambda endpoints return correct responses
- ✅ No disruption to frontend functionality

### Phase 2 Success
- ✅ Code coverage report generated with clear metrics
- ✅ Unit test coverage increases to 85%+ (from current ~75%)
- ✅ All new tests pass consistently
- ✅ No regression in existing tests

### Phase 3 Success
- ✅ Transcript content loads and displays when button is toggled
- ✅ Clear error messages if transcript data is missing
- ✅ Unit and E2E tests verify transcript rendering
- ✅ No console errors or warnings related to transcript

## Important Notes

### For Implementation Engineer

You are implementing this plan with **zero context** on the codebase. Follow these guidelines:

- **Read Phase 0 first** - It contains critical architecture decisions and patterns
- **Don't skip verification steps** - Each checklist item prevents future bugs
- **Run tests frequently** - Catch regressions early
- **Commit atomically** - Use the provided commit message templates
- **Ask questions if stuck** - Don't guess at requirements
- **Follow DRY, YAGNI, TDD** - These principles are non-negotiable

### Token Budget Management

Each phase is designed to fit within ~100k tokens including:
- Reading this README (~3k tokens)
- Reading Phase 0 (~15k tokens)
- Reading Phase N (~10-15k tokens)
- Implementation and testing (~60-80k tokens)

If you're approaching token limits, complete the current task's verification checklist and commit, then continue in a fresh context.

## Support

If you encounter issues:
1. Check Phase 0 for common pitfalls
2. Review task prerequisites
3. Verify environment setup
4. Check existing tests for patterns
5. Consult AWS SAM documentation for deployment issues

## Getting Started

Begin with [Phase 0: Foundation](./Phase-0.md) to understand the architectural decisions and conventions that apply to all phases.

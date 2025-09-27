# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cakravia is a Next.js-based web application for comprehensive learning assessment offering multiple test types. The application includes user authentication (email/password and Google Sign-In), payment processing via Midtrans, and comprehensive test flows for assessing various learning and behavioral dimensions.

### Available Assessment Types
1. **VARK Test** - Learning style assessment (Visual, Aural, Read/Write, Kinesthetic)
2. **AI Knowledge Test** - AI usage attitudes assessment across 8 psychological dimensions
3. **Behavioral Test** - Behavioral assessment across 4 key dimensions
4. **Comprehensive Test** - Combined assessment integrating multiple assessment types

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Project Architecture

### Core Structure
- **Next.js 15.3.4** with App Router (`src/app/` directory)
- **TypeScript** with strict type checking
- **Tailwind CSS** for styling with custom components
- **Radix UI** components for accessible UI elements

### Key Directories
- `src/app/` - Next.js app router pages and layouts
- `src/components/` - Reusable React components
- `src/contexts/` - React context providers (AuthContext)
- `src/lib/` - Utility functions, API clients, and type definitions
- `src/assets/` - Static images and media files

### Authentication System
The app uses a sophisticated authentication system supporting both email/password and Google Sign-In:

- **AuthContext** (`src/contexts/AuthContext.tsx`) - Centralized auth state management
- **Cross-authentication** - Handles scenarios where users have both email and Google accounts
- **Token management** - Uses HTTP-only cookies for secure token storage
- **API client** (`src/lib/api/client.ts`) - Axios-based client with automatic token injection

### API Integration
- **Base URL**: `https://api.cakravia.com/api/v1`
- **Structure**: Modular API services in `src/lib/api/`
  - `auth.ts` - Authentication endpoints
  - `vark.ts` - VARK test endpoints
  - `aiKnowledge.ts` - AI Knowledge test endpoints
  - `behavioral.ts` - Behavioral test endpoints
  - `comprehensive.ts` - Comprehensive test endpoints
  - `payment.ts` - Payment processing
  - `client.ts` - Base axios configuration

### Key Features
1. **Multi-Type Assessment System** - Four different assessment types with unified interface
2. **VARK Assessment Flow** - Learning style assessment with timer and navigation
3. **AI Knowledge Assessment** - 8-dimension AI usage attitudes evaluation
4. **Behavioral Assessment** - 4-dimension behavioral analysis
5. **Comprehensive Assessment** - Combined multi-dimensional evaluation
6. **Unified Profile Management** - Complete test history across all assessment types
7. **Payment Integration** - Midtrans payment gateway for premium features
8. **Results Dashboard** - Comprehensive analysis with charts for each test type
9. **User Management** - Profile management and authentication state

### Component Architecture
- **VarkTestFlow** - Main test component with state management for questions, answers, and timing
- **ProtectedRoute** - HOC for authentication-required pages
- **GoogleSignInButton** - Google OAuth integration
- **UI Components** - Radix UI-based components in `src/components/ui/`

### Type Safety
Comprehensive TypeScript types in `src/lib/types.ts` covering:
- User and authentication types
- VARK test and question types
- AI Knowledge test types (8 categories: PE, EE, SI, FC, HM, PV, HT, BI)
- Behavioral test types (4 dimensions: H, M, R, E)
- Comprehensive test types (5 dimensions: CF, R, MA, AG, E)
- Unified test history interfaces for consistent display
- Payment and order types
- API response types
- Google authentication types

### State Management
- **React Context** for global auth state
- **Local component state** for UI interactions
- **Cookie-based persistence** for user sessions

## Development Notes

### Testing
- Use existing test endpoints for development:
  - `/test-auth` - Authentication testing
  - `/test-payment` - Payment flow testing
  - `/test-vark` - VARK assessment testing
  - `/ai-knowledge-test-results` - AI Knowledge test results
  - `/behavioral-test-results` - Behavioral test results
  - `/comprehensive-test-results` - Comprehensive test results
- Payment testing uses Midtrans sandbox environment
- Each test type has individual API endpoints for graceful error handling

### Styling
- Tailwind CSS with custom configuration
- Responsive design patterns
- Dark mode support considerations

### API Error Handling
- Automatic 401 handling with redirect to login
- Comprehensive error types and user-friendly messages
- Request/response interceptors for global error handling

### Payment Flow
- Order creation → Payment token generation → Midtrans snap → Payment verification
- Real-time payment status updates
- Certificate generation after successful payment
- Multi-test-type certificate support via unified endpoint structure

## Assessment Architecture

### Individual Test Type Architecture
Each assessment type follows a consistent pattern:

1. **Question Set Management**: Active question sets with versioning
2. **Test Session Management**: Progress tracking and expiration handling
3. **Answer Submission**: Uniform answer format across all types
4. **Results Processing**: Type-specific scoring and analysis
5. **Progress Persistence**: localStorage-based state management

### Unified Profile Integration
The profile page consolidates all test types using:

- **Promise.all() with individual error handling** for concurrent API calls
- **Type conversion utilities** to normalize different test structures
- **Unified interfaces** for consistent display across test types
- **Type badges and indicators** for clear test type identification
- **Responsive design** supporting both mobile cards and desktop table views

#### API Endpoints Used:
```typescript
// Profile page fetches from all these endpoints
GET /users/vark_tests              // VARK test history
GET /users/ai_knowledge_tests      // AI Knowledge test history
GET /users/behavioral_tests        // Behavioral test history
GET /users/comprehensive_tests     // Comprehensive test history
```

#### Test Type Routing:
- **VARK**: `/results?testId={id}` (existing)
- **AI Knowledge**: `/ai-knowledge-test-results?testId={id}`
- **Behavioral**: `/behavioral-test-results?testId={id}`
- **Comprehensive**: `/comprehensive-test-results?testId={id}`

### Scalability Considerations
The individual API approach (vs unified API) provides:

- **Type Safety**: Each test maintains its specific data structures
- **Independent Error Handling**: One test type failure doesn't break others
- **Controlled Feature Rollout**: New test types added incrementally
- **Performance**: Selective loading and caching per test type
- **Maintainability**: Clear separation of concerns for each assessment type

## Multi-Test Implementation Notes

### For Developers
When working with the multi-test system:

1. **Adding New Test Types**: Follow the established pattern in `src/lib/api/` for new APIs
2. **Profile Page Updates**: Update unified interfaces in profile page when adding test types
3. **Type Definitions**: Add new test interfaces to `src/lib/types.ts`
4. **Progress Management**: Create corresponding progress managers in `src/lib/`
5. **Results Pages**: Ensure proper routing and results page implementation

### Error Handling Strategy
The system uses graceful degradation:
- Individual test type failures are isolated
- Partial data display when some APIs fail
- Clear error messaging per test type
- Fallback to available test types when others are unavailable
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cakravia is a Next.js-based web application for learning style assessment using the VARK (Visual, Aural, Read/Write, Kinesthetic) methodology. The application includes user authentication (email/password and Google Sign-In), payment processing via Midtrans, and a comprehensive test flow for assessing learning preferences.

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
  - `payment.ts` - Payment processing
  - `client.ts` - Base axios configuration

### Key Features
1. **VARK Assessment Flow** - Multi-step test with timer, question navigation, and scoring
2. **Payment Integration** - Midtrans payment gateway for test access
3. **Results Dashboard** - Comprehensive learning style analysis with charts
4. **User Management** - Profile management and authentication state

### Component Architecture
- **VarkTestFlow** - Main test component with state management for questions, answers, and timing
- **ProtectedRoute** - HOC for authentication-required pages
- **GoogleSignInButton** - Google OAuth integration
- **UI Components** - Radix UI-based components in `src/components/ui/`

### Type Safety
Comprehensive TypeScript types in `src/lib/types.ts` covering:
- User and authentication types
- VARK test and question types
- Payment and order types
- API response types
- Google authentication types

### State Management
- **React Context** for global auth state
- **Local component state** for UI interactions
- **Cookie-based persistence** for user sessions

## Development Notes

### Testing
- Use existing test endpoints (`/test-auth`, `/test-payment`, `/test-vark`) for development
- Payment testing uses Midtrans sandbox environment

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
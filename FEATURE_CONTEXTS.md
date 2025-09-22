# Cakravia Feature Contexts Documentation

This document provides comprehensive context for each major feature in the Cakravia application, helping you understand the architecture, components, and relationships to efficiently modify or add new features.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Authentication System Context](#authentication-system-context)
3. [VARK Test System Context](#vark-test-system-context)
4. [Payment Integration Context](#payment-integration-context)
5. [UI/Component System Context](#uicomponent-system-context)
6. [API Architecture Context](#api-architecture-context)
7. [Development Guidelines](#development-guidelines)

---

## Project Overview

### Architecture Stack
- **Framework**: Next.js 15.3.4 with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI for accessible components
- **State Management**: React Context for authentication
- **API Communication**: Axios with interceptors
- **Authentication**: JWT tokens + Google OAuth
- **Payment**: Midtrans integration

### Core Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-related pages (login, register, etc.)
│   ├── api/               # API routes for health checks
│   └── [pages]/           # Feature pages (test, results, profile)
├── components/            # Reusable React components
│   └── ui/               # Radix UI components
├── contexts/             # React Context providers
├── lib/                  # Utilities, API clients, types
│   ├── api/             # API service modules
│   └── types.ts         # TypeScript definitions
└── assets/              # Static images and media
```

---

## Authentication System Context

### Overview
The authentication system supports dual authentication methods: traditional email/password and Google OAuth, with sophisticated cross-authentication handling when users have accounts with both methods.

### Key Components

#### 1. AuthContext (`src/contexts/AuthContext.tsx`)
**Purpose**: Centralized authentication state management
**Key Features**:
- JWT token management with HTTP-only cookies
- Cross-authentication state handling
- Google OAuth integration
- Automatic token refresh and validation

**State Structure**:
```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
  requiresGoogleAuth: boolean;
  googleAuthMessage: string;
  clearGoogleAuthState: () => void;
}
```

#### 2. Authentication API (`src/lib/api/auth.ts`)
**Purpose**: API communication for all authentication operations
**Key Methods**:
- `register()` - User registration with validation
- `login()` - Enhanced login with cross-auth detection
- `googleLogin()` - Google OAuth token verification
- `requestPasswordReset()` - Password reset flow
- `confirmPasswordReset()` - Reset token validation
- `changePassword()` - Authenticated password change
- `getProfile()` - User profile retrieval
- `updateProfile()` - Profile updates with file upload

#### 3. Google Sign-In Component (`src/components/GoogleSignInButton.tsx`)
**Purpose**: Google OAuth integration UI component
**Features**:
- Dynamic Google SDK loading
- Automatic button rendering
- Error handling and fallbacks
- Responsive design with loading states

#### 4. Protected Route HOC (`src/components/ProtectedRoute.tsx`)
**Purpose**: Route-level authentication protection
**Usage Pattern**:
```tsx
<ProtectedRoute redirectTo="/login">
  <YourProtectedComponent />
</ProtectedRoute>
```

### Authentication Flow Diagrams

#### Email/Password Login Flow
```
User Input → AuthContext.login() → authAPI.login()
  ↓
API Response Analysis
  ↓
Success: Store token & user → Update Context State
Cross-Auth Detected: Show Google Sign-in Required
Error: Display error message
```

#### Google OAuth Flow
```
Google Button Click → Google SDK → ID Token
  ↓
AuthContext.googleLogin() → authAPI.googleLogin()
  ↓
Backend Verification → JWT Token + User Data
  ↓
Store in Cookies → Update Context State
```

### Extension Points

#### Adding New Auth Provider
1. **Add provider types** in `src/lib/types.ts`
2. **Create API methods** in `src/lib/api/auth.ts`
3. **Update AuthContext** with provider-specific methods
4. **Create UI component** following GoogleSignInButton pattern
5. **Update User interface** with provider fields

#### Adding Auth Middleware
1. **Modify API client** in `src/lib/api/client.ts`
2. **Update request interceptor** for additional headers
3. **Enhance error handling** in response interceptor

---

## VARK Test System Context

### Overview
The VARK (Visual, Aural, Read/Write, Kinesthetic) learning style assessment system features a chat-based interface, progress saving, timer management, and comprehensive results analysis.

### Key Components

#### 1. Test Interface (`src/app/test/page.tsx`)
**Purpose**: Main test UI with chat-based interaction
**Key Features**:
- Chat-style question/answer interface
- Real-time progress saving to localStorage
- Cross-device continuation support
- Timer with auto-submission
- Responsive slider input for answers

**State Structure**:
```typescript
interface TestState {
  step: 'loading' | 'ready' | 'testing' | 'submitting' | 'completed' | 'error';
  questionSet: VarkQuestionSet | null;
  test: VarkTest | null;
  currentQuestionIndex: number;
  answers: Record<string, VarkAnswer>;
  timeLeft: number;
  error: string | null;
}
```

#### 2. VARK API (`src/lib/api/vark.ts`)
**Purpose**: All VARK test-related API communication
**Key Methods**:
- `getActiveQuestionSet()` - Fetch current question set
- `createTest()` - Initialize new test instance
- `getTest()` - Retrieve existing test data
- `submitAnswers()` - Submit completed answers
- `getTestResults()` - Fetch processed results
- `startTestFlow()` - Combined initialization helper

#### 3. Test Progress Manager (`src/lib/testProgress.tsx`)
**Purpose**: Cross-device progress persistence
**Features**:
- localStorage-based progress saving
- Version-controlled progress format
- Cross-device warning system
- Automatic cleanup on completion

#### 4. VarkTestFlow Component (`src/components/VarkTestFlow.tsx`)
**Purpose**: Alternative simplified test interface
**Note**: Legacy component, main interface is in `src/app/test/page.tsx`

### Data Flow Architecture

#### Test Lifecycle
```
Test Initialization
  ↓
Question Set Fetching → Test Creation → State Initialization
  ↓
Testing Phase
  ↓
Question Display → User Answer → Progress Save → Next Question
  ↓
Completion
  ↓
Answer Submission → Results Processing → Results Display
```

#### Progress Saving Flow
```
Answer Submission → TestProgressManager.saveProgress()
  ↓
localStorage Update → Cross-device Sync Ready
  ↓
Page Reload/Navigation → Progress Restoration
```

### Test Types and Scoring

#### Question Structure
```typescript
interface VarkQuestion {
  id: string;
  body: string;
  max_weight: number;
  category: VarkCategory; // V, A, R, K
}
```

#### Answer Format
```typescript
interface VarkAnswer {
  question_id: string;
  category_id: string;
  point: number; // 1.0 to max_weight
}
```

### Extension Points

#### Adding New Question Types
1. **Extend VarkQuestion interface** with new fields
2. **Update question rendering** in test interface
3. **Modify answer collection** logic
4. **Update scoring algorithm** in backend

#### Customizing Test UI
1. **Modify chat components** in `src/app/test/page.tsx`
2. **Update slider component** for different input types
3. **Customize progress indicators** and timers
4. **Add new test state handlers**

---

## Payment Integration Context

### Overview
The payment system integrates with Midtrans payment gateway for VARK test purchases, handling order creation, payment processing, and test unlocking.

### Key Components

#### 1. Payment API (`src/lib/api/payment.ts`)
**Purpose**: Midtrans payment integration
**Key Methods**:
- `createVarkOrder()` - Create payment order for test
- `getVarkPaymentToken()` - Generate Midtrans payment token
- `initializeVarkPayment()` - Combined order + token creation

#### 2. Test Payment Page (`src/app/test-payment/page.tsx`)
**Purpose**: Payment testing interface
**Features**:
- Editable test credentials
- Payment flow testing
- Midtrans Snap integration
- Error handling demonstration

### Payment Flow Architecture

#### Complete Payment Flow
```
Test Selection → Order Creation → Payment Token Generation
  ↓
Midtrans Snap Redirect → User Payment → Payment Verification
  ↓
Test Unlocking → Certificate Generation → Access Granted
```

#### Order Management
```typescript
interface PaymentOrder {
  id: string;
  order_number: string;
  amount: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  expires_at: string;
  testable: {
    id: string;
    type: string;
    status: string;
  };
  can_download_certificate: boolean;
}
```

#### Payment Token Structure
```typescript
interface PaymentToken {
  id: string;
  snap_token: string;
  midtrans_order_id: string;
  amount: string;
  midtrans_response: string; // Contains redirect_url
}
```

### Extension Points

#### Adding New Payment Methods
1. **Extend PaymentOrder interface** with provider fields
2. **Add provider-specific API methods**
3. **Update payment token handling**
4. **Modify UI components** for new payment flows

#### Custom Payment Logic
1. **Modify order creation** in `paymentAPI.createVarkOrder()`
2. **Update payment verification** logic
3. **Customize success/failure handlers**

---

## UI/Component System Context

### Overview
The UI system is built on Radix UI primitives with Tailwind CSS, providing accessible, consistent, and responsive components across the application.

### Key Components

#### 1. Design System Components (`src/components/ui/`)
**Available Components**:
- `button.tsx` - Button variants and states
- `card.tsx` - Container components
- `progress.tsx` - Progress indicators
- `scroll-area.tsx` - Custom scrollbars
- `slider.tsx` - Range input controls

#### 2. Layout Components

#### Header Component (`src/components/Header.tsx`)
**Purpose**: Global navigation and user interface
**Features**:
- Responsive mobile/desktop navigation
- User avatar with automatic fallbacks
- Authentication state integration
- Active page indicators

**Usage Pattern**:
```tsx
<Header currentPage="test" transparent={true} />
```

#### Protected Route HOC (`src/components/ProtectedRoute.tsx`)
**Purpose**: Authentication-required page wrapper
**Features**:
- Automatic redirect handling
- Loading states
- Authentication status checking

### Styling Architecture

#### Tailwind Configuration
- **Custom colors**: Brand-specific color palette
- **Typography**: Merriweather Sans font family
- **Responsive breakpoints**: Mobile-first approach
- **Component utilities**: Reusable utility classes

#### Color Scheme
```css
Primary: #2A3262 (Deep blue)
Secondary: #ABD305 (Lime green)
Background: #DFE4FF (Light blue)
Accent: Various contextual colors
```

### Component Patterns

#### Consistent Props Interface
```typescript
interface ComponentProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}
```

#### Error Handling Pattern
```tsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <AlertCircle className="w-5 h-5 text-red-500 inline mr-2" />
    <span className="text-red-700">{error}</span>
  </div>
)}
```

### Extension Points

#### Adding New UI Components
1. **Create component file** in `src/components/ui/`
2. **Follow Radix UI patterns** for accessibility
3. **Use Tailwind utility classes** for styling
4. **Export from index** for easy imports
5. **Add TypeScript interfaces** for props

#### Customizing Design System
1. **Update Tailwind config** for new colors/spacing
2. **Modify base component styles**
3. **Add new variant classes**
4. **Update global CSS** in `src/app/globals.css`

---

## API Architecture Context

### Overview
The API layer uses Axios with interceptors for authentication, error handling, and request/response processing, communicating with the Ruby on Rails backend at `https://api.cakravia.com/api/v1`.

### Key Components

#### 1. API Client (`src/lib/api/client.ts`)
**Purpose**: Centralized HTTP client configuration
**Features**:
- Automatic JWT token injection
- Global error handling
- Request/response interceptors
- 401 redirect handling

**Configuration**:
```typescript
const apiClient = axios.create({
  baseURL: 'https://api.cakravia.com/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
});
```

#### 2. API Service Modules

#### Authentication API (`src/lib/api/auth.ts`)
**Endpoints**:
- `POST /users/register` - User registration
- `POST /users/login` - Email/password login
- `POST /users/google_login` - Google OAuth
- `GET /users/profile` - User profile
- `PUT /users` - Profile updates
- `POST /users/password_reset` - Password reset request
- `POST /users/password_reset_confirm` - Reset confirmation
- `PATCH /users/password_change` - Password change

#### VARK API (`src/lib/api/vark.ts`)
**Endpoints**:
- `GET /users/vark_tests/active_question_set` - Active questions
- `POST /users/vark_tests` - Create test
- `GET /users/vark_tests/:id` - Get test
- `POST /users/vark_tests/:id/submit_answers` - Submit answers
- `GET /users/vark_tests/:id/results` - Get results

#### Payment API (`src/lib/api/payment.ts`)
**Endpoints**:
- `POST /users/vark_tests/:id/orders` - Create order
- `POST /users/vark_tests/:id/orders/payment_token` - Get payment token

### Type Safety Architecture

#### API Response Pattern
```typescript
interface ApiResponse<T> {
  data: T;
  status: string;
  error: boolean;
}
```

#### Error Handling Pattern
```typescript
interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}
```

### Request/Response Flow

#### Authenticated Request Flow
```
Component → API Method → apiClient Request
  ↓
Request Interceptor → Add JWT Token → Send Request
  ↓
Backend Processing → Response
  ↓
Response Interceptor → Error Handling → Component
```

#### Error Handling Flow
```
API Error → Response Interceptor → Error Classification
  ↓
401 Unauthorized → Clear Tokens → Redirect to Login
Other Errors → Pass to Component → User Notification
```

### Extension Points

#### Adding New API Endpoints
1. **Create new service file** in `src/lib/api/`
2. **Define TypeScript interfaces** for requests/responses
3. **Add error handling** for specific endpoint errors
4. **Export from api index** for easy imports

#### Modifying Authentication
1. **Update request interceptor** in `src/lib/api/client.ts`
2. **Add new token types** or headers
3. **Modify error handling** for new auth states

---

## Development Guidelines

### Adding New Features

#### 1. Planning Phase
- [ ] **Define feature scope** and user requirements
- [ ] **Design data models** and API contracts
- [ ] **Plan component architecture** and state management
- [ ] **Consider integration points** with existing features

#### 2. Implementation Checklist
- [ ] **Create TypeScript interfaces** in `src/lib/types.ts`
- [ ] **Build API service module** in `src/lib/api/`
- [ ] **Implement UI components** following design system
- [ ] **Add page routes** in `src/app/` directory
- [ ] **Update navigation** in Header component
- [ ] **Add error handling** and loading states

#### 3. Integration Guidelines
- [ ] **Use existing AuthContext** for authentication needs
- [ ] **Follow API client patterns** for HTTP communication
- [ ] **Implement ProtectedRoute** for auth-required pages
- [ ] **Use consistent error handling** patterns
- [ ] **Add proper TypeScript typing** throughout

### Common Modification Scenarios

#### Adding New User Fields
1. **Update User interface** in `src/lib/types.ts`
2. **Modify registration form** in `src/app/register/page.tsx`
3. **Update profile page** in `src/app/profile/page.tsx`
4. **Add API endpoints** in `src/lib/api/auth.ts`
5. **Update AuthContext** if needed

#### Creating New Test Types
1. **Define test interfaces** in `src/lib/types.ts`
2. **Create API service** in `src/lib/api/`
3. **Build test interface** similar to `src/app/test/page.tsx`
4. **Add results processing** components
5. **Update navigation** and routing

#### Adding Payment Providers
1. **Extend PaymentOrder interface** with provider fields
2. **Add provider API methods** in `src/lib/api/payment.ts`
3. **Create provider UI components**
4. **Update payment flow logic**
5. **Add error handling** for provider-specific errors

### Code Quality Standards

#### TypeScript Usage
- **Always define interfaces** for data structures
- **Use strict type checking**
- **Avoid `any` type** - use proper typing
- **Export types** from centralized locations

#### Component Patterns
- **Use functional components** with hooks
- **Implement proper error boundaries**
- **Follow consistent props interfaces**
- **Add proper accessibility** attributes

#### API Integration
- **Use centralized API client**
- **Implement consistent error handling**
- **Add request/response logging** for debugging
- **Follow RESTful conventions**

### Testing Strategy

#### Component Testing
- **Test user interactions** and state changes
- **Mock API calls** for isolated testing
- **Test error states** and edge cases
- **Verify accessibility** compliance

#### API Testing
- **Use test pages** like `src/app/test-payment/page.tsx`
- **Test error scenarios** and edge cases
- **Verify authentication** flows
- **Test cross-browser** compatibility

### Performance Considerations

#### Optimization Techniques
- **Lazy load components** for better initial load
- **Implement proper caching** for API responses
- **Use React.memo** for expensive components
- **Optimize images** and static assets

#### Monitoring
- **Add performance logging** for critical paths
- **Monitor API response times**
- **Track user interaction** metrics
- **Set up error monitoring** for production

---

## Conclusion

This feature context documentation provides a comprehensive guide for understanding and extending the Cakravia application. Each feature is designed with clear separation of concerns, consistent patterns, and extensible architecture.

When adding new features or modifying existing ones, refer to the specific feature contexts and follow the established patterns for maintainable, scalable code.

For questions or clarifications about any feature context, refer to the specific component files and their inline documentation.
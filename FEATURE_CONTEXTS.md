# Cakravia Feature Contexts Documentation

This document provides comprehensive context for each major feature in the Cakravia application, helping you understand the architecture, components, and relationships to efficiently modify or add new features.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Authentication System Context](#authentication-system-context)
3. [VARK Test System Context](#vark-test-system-context)
4. [AI Knowledge Test System Context](#ai-knowledge-test-system-context)
5. [Behavioral Test System Context](#behavioral-test-system-context)
6. [Comprehensive Test System Context](#comprehensive-test-system-context)
7. [TPA Assessment System Context](#tpa-assessment-system-context)
8. [Payment Integration Context](#payment-integration-context)
9. [Coupon/Voucher System Context](#couponvoucher-system-context)
10. [Profile Management Context](#profile-management-context)
11. [UI/Component System Context](#uicomponent-system-context)
12. [API Architecture Context](#api-architecture-context)
13. [Development Guidelines](#development-guidelines)
14. [Documentation Maintenance Process](#documentation-maintenance-process)

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

## AI Knowledge Test System Context

### Overview
The AI Knowledge Test system is a comprehensive psychological assessment that measures users' attitudes toward AI usage in learning across 8 dimensions. It reuses the proven VARK test UI architecture while connecting to specialized AI Knowledge APIs and implementing an 8-category scoring system instead of VARK's 4-category approach.

### Key Components

#### 1. Test Interface (`src/app/ai-knowledge-test/page.tsx`)
**Purpose**: Main AI Knowledge test UI with chat-based interaction
**Key Features**:
- Identical chat-style interface to VARK test
- 40-question assessment with 1-5 Likert scale
- Isolated progress saving (separate from VARK)
- Cross-device continuation support
- Timer with auto-submission
- Real-time progress indicators

**State Structure**:
```typescript
interface TestState {
  step: 'loading' | 'ready' | 'testing' | 'submitting' | 'completed' | 'error';
  questionSet: AiKnowledgeQuestionSet | null;
  test: AiKnowledgeTest | null;
  currentQuestionIndex: number;
  answers: Record<string, AiKnowledgeAnswer>;
  timeLeft: number;
  error: string | null;
}
```

#### 2. AI Knowledge API (`src/lib/api/aiKnowledge.ts`)
**Purpose**: All AI Knowledge test-related API communication
**Key Methods**:
- `getActiveQuestionSet()` - Fetch current question set
- `createTest()` - Initialize new test instance
- `getTest()` - Retrieve existing test data
- `submitAnswers()` - Submit completed answers
- `getTestResults()` - Fetch processed results with 8-dimension scoring
- `startTestFlow()` - Combined initialization helper

**API Endpoints Pattern**:
- `GET /users/ai_knowledge_tests/active_question_set`
- `POST /users/ai_knowledge_tests` (with `ai_knowledge_question_set_id`)
- `GET /users/ai_knowledge_tests/:id`
- `POST /users/ai_knowledge_tests/:id/submit_answers`
- `GET /users/ai_knowledge_tests/:id/results`

#### 3. Test Progress Manager (`src/lib/aiKnowledgeTestProgress.ts`)
**Purpose**: Isolated cross-device progress persistence
**Features**:
- Uses `ai_knowledge_test_progress` localStorage key (isolated from VARK)
- Version-controlled progress format
- Cross-device warning system
- Automatic cleanup on completion
- Same functionality as VARK but completely separate storage

#### 4. Results Dashboard (`src/app/ai-knowledge-test-results/page.tsx`)
**Purpose**: Comprehensive 8-dimension results visualization
**Key Features**:
- Radar chart for 8 psychological dimensions
- Bar chart for category breakdown
- Detailed category interpretations
- AI readiness level assessment
- Recommendations and insights

### Psychological Dimensions (8 Categories)

#### Dimension Structure
```typescript
interface AiKnowledgeCategory {
  id: string;
  code: string; // PE, EE, SI, FC, HM, PV, HT, BI
  name: string;
}
```

#### The 8 Dimensions
1. **PE (Performance Expectancy)** - Belief that AI will improve performance
2. **EE (Effort Expectancy)** - Ease of using AI tools
3. **SI (Social Influence)** - Social pressure to use AI
4. **FC (Facilitating Conditions)** - Resources available for AI use
5. **HM (Hedonic Motivation)** - Enjoyment from using AI
6. **PV (Price Value)** - Cost-benefit perception of AI
7. **HT (Habit)** - Habitual AI usage patterns
8. **BI (Behavioral Intention)** - Intention to use AI

### Data Models

#### Question Structure
```typescript
interface AiKnowledgeQuestion {
  id: string;
  body: string;
  max_weight: number; // Always 5 for Likert scale
  category: AiKnowledgeCategory;
}
```

#### Answer Format
```typescript
interface AiKnowledgeAnswer {
  question_id: string;
  category_id: string;
  point: number; // 1.0 to 5.0 for Likert scale
}
```

#### Results Structure
```typescript
interface AiKnowledgeTestResults {
  pe_score: number;    // Performance Expectancy score
  ee_score: number;    // Effort Expectancy score
  si_score: number;    // Social Influence score
  fc_score: number;    // Facilitating Conditions score
  hm_score: number;    // Hedonic Motivation score
  pv_score: number;    // Price Value score
  ht_score: number;    // Habit score
  bi_score: number;    // Behavioral Intention score
  min_score: number;
  max_score: number;
  total_score: number;
  scores_breakdown: AiKnowledgeScoreBreakdown[];
  dominant_categories: string[];
  category_interpretations: Record<string, string>;
  result_description: {
    title: string;
    description: string;
    recommendations: string;
    ai_readiness_level: string;
  };
}
```

### Data Flow Architecture

#### Test Lifecycle
```
Test Initialization
  ↓
Question Set Fetching → Test Creation → State Initialization
  ↓
Testing Phase (40 questions)
  ↓
Question Display → User Answer (Likert Scale) → Progress Save → Next Question
  ↓
Completion
  ↓
Answer Submission → 8-Dimension Analysis → Results Display
```

#### Progress Saving Flow
```
Answer Submission → aiKnowledgeTestProgress.saveProgress()
  ↓
localStorage Update (isolated key) → Cross-device Sync Ready
  ↓
Page Reload/Navigation → Progress Restoration
```

### Integration Points

#### Homepage Integration
**Carousel Item** (`src/app/page.tsx`):
```typescript
{
  title: "Artificial Intelligence Assessment",
  subtitle: "Measure Your AI Learning Readiness and Attitudes.",
  description: "Discover your attitudes toward AI usage in learning across 8 psychological dimensions...",
  available: true, // Updated from false
  href: "/ai-knowledge-test" // Updated from "#"
}
```

**Test Card** (`src/app/page.tsx`):
```typescript
{
  title: "AI Knowledge",
  buttonText: "Start Exam", // Updated from "Coming Soon"
  href: "/ai-knowledge-test", // Updated from "#"
  available: true // Updated from false
}
```

#### Scalable Header Component
**Updated for Multiple Test Types** (`src/components/Header.tsx`):
```typescript
interface HeaderProps {
  currentPage?: string; // Accept any string for unlimited test types
  transparent?: boolean;
}
```

### Architectural Patterns

#### Reusable Test Architecture
The AI Knowledge Test demonstrates the scalable pattern for multiple test types:

1. **Shared UI Components**: Same chat interface, slider inputs, progress indicators
2. **Isolated API Services**: Separate API modules for each test type
3. **Independent Progress Management**: Isolated localStorage keys prevent conflicts
4. **Consistent Data Models**: Similar interfaces with test-specific extensions
5. **Scalable Navigation**: Header component accepts any test type string

#### Type Safety Patterns
```typescript
// Generic test interfaces that can be extended
interface BaseTest {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface BaseTestResults {
  min_score: number;
  max_score: number;
  total_score: number;
  scores_breakdown: ScoreBreakdown[];
}

// Specific implementations extend base interfaces
interface AiKnowledgeTest extends BaseTest {
  ai_knowledge_question_set_id: string;
}

interface AiKnowledgeTestResults extends BaseTestResults {
  pe_score: number;
  ee_score: number;
  // ... other AI-specific fields
}
```

### Extension Points

#### Adding New Test Types
The AI Knowledge Test implementation provides a blueprint for future test types:

1. **Create new API service** following `aiKnowledge.ts` pattern
2. **Define test-specific interfaces** extending base types
3. **Create isolated progress manager** with unique localStorage key
4. **Build test interface** copying the proven chat-based UI
5. **Implement results dashboard** with test-specific visualizations
6. **Update homepage integration** with new test cards
7. **No Header component changes needed** (scalable design)

#### Customizing Scoring Systems
1. **Modify results interfaces** for new dimension structures
2. **Update visualization components** for different chart types
3. **Adapt API response handling** for new scoring algorithms
4. **Customize category interpretations** and recommendations

### Development Considerations

#### Data Conversion Patterns
The AI Knowledge API includes automatic string-to-number conversion for scores:
```typescript
const convertedData: AiKnowledgeTestResults = {
  ...rawData,
  pe_score: typeof rawData.pe_score === 'string' ? parseFloat(rawData.pe_score) : rawData.pe_score,
  // ... similar conversions for all numeric fields
};
```

#### Error Handling Consistency
All AI Knowledge API methods follow the same error handling pattern as VARK:
```typescript
catch (error) {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  if (axiosError.response?.data?.message) {
    throw new Error(axiosError.response.data.message);
  } else {
    throw new Error('Failed to [operation]. Please try again.');
  }
}
```

#### Visualization Requirements
- **ApexCharts integration** for radar and bar charts
- **8-category color mapping** for consistent visual identity
- **Responsive design** for mobile and desktop results viewing
- **Accessibility considerations** for chart data interpretation

---

## Behavioral Test System Context

### Overview
The Behavioral Learning Test assesses behavioral patterns across 4 dimensions based on established learning theories: Observation (Bandura), Self-Regulation (Zimmerman & Pintrich), Goal Setting (Locke & Latham), and Learning Outcomes (Bloom & Bandura).

### Key Components

#### 1. Test Interface (`src/app/behavioral-test/page.tsx`)
**Purpose**: Behavioral assessment with chat-based interaction
**Key Features**:
- Chat-style question/answer interface
- 4-dimension behavioral assessment
- Real-time progress saving to localStorage
- Cross-device continuation support
- Timer with auto-submission

#### 2. Behavioral API (`src/lib/api/behavioral.ts`)
**Purpose**: All Behavioral test-related API communication
**Key Methods**:
- `getActiveQuestionSet()` - Fetch current question set
- `createTest()` - Initialize new test instance
- `submitAnswers()` - Submit completed answers
- `getTestResults()` - Fetch 4-dimension results

**API Endpoints**:
- `GET /users/behavioral_learning_tests/active_question_set`
- `POST /users/behavioral_learning_tests`
- `POST /users/behavioral_learning_tests/:id/submit_answers`
- `GET /users/behavioral_learning_tests/:id/results`

### The 4 Behavioral Dimensions

1. **OBS (Observation)** - Based on Bandura's Observational Learning theory
   - Attention, Retention, Reproduction, Motivation
2. **SRL (Self-Regulation)** - Based on Zimmerman & Pintrich's SRL model
   - Forethought, Performance, Self-Reflection
3. **GOL (Goal Setting)** - Based on Locke & Latham's Goal-Setting Theory
   - SMART goals framework
4. **OUT (Learning Outcomes)** - Based on Bloom's Taxonomy and Bandura's Self-Efficacy

### Results Display
- Results page: `/behavioral-test-results?testId={id}`
- 4-dimension breakdown with radar charts
- Behavioral insights and recommendations
- Payment integration for certificate generation

---

## Comprehensive Test System Context

### Overview
The Comprehensive Assessment combines elements from VARK, AI Knowledge, and Behavioral tests into a complete learning profile assessment across 5 key dimensions.

### Key Components

#### 1. Test Interface (`src/app/comprehensive-test/page.tsx`)
**Purpose**: Comprehensive assessment combining multiple test types
**Key Features**:
- Extended test session (longer time limits)
- Questions spanning multiple assessment categories
- Chat-based interface with category type indicators
- Progress tracking across all dimensions

#### 2. Comprehensive API (`src/lib/api/comprehensive.ts`)
**Purpose**: Comprehensive test-related API communication
**Key Methods**:
- `getActiveQuestionSet()` - Fetch comprehensive question set
- `createTest()` - Initialize comprehensive test
- `submitAnswers()` - Submit all answers
- `getTestResults()` - Fetch 5-dimension results

**API Endpoints**:
- `GET /users/comprehensive_assessment_tests/active_question_set`
- `POST /users/comprehensive_assessment_tests`
- `POST /users/comprehensive_assessment_tests/:id/submit_answers`
- `GET /users/comprehensive_assessment_tests/:id/results`

### The 5 Comprehensive Dimensions

1. **CF (Cognitive Flexibility)** - Mental ability to adapt and change thinking
2. **R (Resilience)** - Capacity to recover from difficulties
3. **MA (Metacognitive Awareness)** - Understanding of own thinking processes
4. **AG (Academic Grit)** - Perseverance toward long-term goals
5. **E (Self-Esteem)** - Subjective evaluation of self-worth

### Pricing & Results
- **Pricing**: Rp. 45,000 (higher than individual tests)
- **Results page**: `/comprehensive-test-results?testId={id}`
- Complete profile with expert-backed insights
- Payment integration with certificate

---

## TPA Assessment System Context

### Overview
Test of Potential Ability (TPA) is a professional cognitive reasoning assessment using a **payment-first architecture**. Unlike other tests where users take the test first and pay for results, TPA requires payment before test access.

### Payment-First Architecture

#### Key Difference from Other Tests
**Other Tests (VARK, AI Knowledge, Behavioral, Comprehensive)**:
```
Test → Results → Payment → Certificate
```

**TPA Test**:
```
Payment → Test → Results + Certificate (already included)
```

### Key Components

#### 1. TPA Payment Landing Page (`src/app/tpa-payment/page.tsx`)
**Purpose**: Payment-first entry point for TPA assessment
**Key Features**:
- Payment information and pricing display (Rp. 50,000)
- Coupon/voucher integration
- Order creation before test access
- Professional assessment positioning

#### 2. TPA Test Interface (`src/app/tpa-test?orderId={id}`)
**Purpose**: Reasoning assessment across 4 cognitive dimensions
**Key Features**:
- Requires paid order validation before access
- 4 reasoning categories with 5 questions each
- Chat-based interface
- Timer and progress tracking

#### 3. TPA API (`src/lib/api/tpa.ts`)
**Purpose**: TPA test and payment operations
**Key Methods**:
- `startPaymentFlow()` - Create order with optional coupon
- `startTestFlow(orderId)` - Create test with paid order validation
- `validateOrderPayment(orderId)` - Check payment status
- `downloadCertificate(testId)` - Download certificate as blob

**API Endpoints**:
- `POST /users/tpa_tests/order` - Create standalone order (payment-first)
- `POST /users/tpa_tests` - Create test (requires order_id)
- `GET /users/tpa_tests/{id}` - Get test
- `POST /users/tpa_tests/{id}/submit_answers` - Submit answers
- `GET /users/tpa_tests/{id}/results` - Get results
- `GET /users/tpa_tests/{id}/orders/download_certificate` - Certificate download

### The 4 Reasoning Dimensions

1. **AR (Analytical Reasoning)** - Breaking down complex problems systematically
2. **QR (Quantitative Reasoning)** - Mathematical and numerical analysis
3. **SR (Spatial Reasoning)** - Visualizing spatial relationships
4. **VR (Verbal Reasoning)** - Language comprehension and logical thinking

### Payment Flow

#### Order Creation Flow
```
User visits /tpa-payment → Clicks payment → CouponModal appears
  ↓
Optional coupon entry → Create order with coupon
  ↓
Midtrans payment processing → Payment success
  ↓
Redirect to /tpa-test?orderId={id} → Test access granted
```

#### Test Access Validation
- System validates `orderId` parameter exists
- Checks order payment status (must be 'paid')
- Only allows test creation with validated paid order
- Prevents unauthorized test access

### Results & Certificate
- **Results page**: `/tpa-test-results?testId={id}`
- Direct certificate download (no additional payment)
- 4-dimension reasoning profile breakdown
- Total reasoning score with strongest categories

### Pricing
- **TPA Price**: Rp. 50,000 (highest among all tests)
- **Coupon support**: Full voucher/discount integration
- **Pre-paid**: Certificate included in initial payment

---

## Payment Integration Context

### Overview
The payment system integrates with Midtrans payment gateway for all assessment types, featuring centralized configuration, dynamic pricing, and consistent payment flows across VARK, AI Knowledge, Behavioral, Comprehensive, and TPA tests.

### Centralized Midtrans Configuration

#### Configuration File (`src/config/midtrans.ts`)
**Purpose**: Single source of truth for all Midtrans settings
**Key Features**:
- Environment-aware configuration (production/sandbox)
- Centralized client keys
- Automatic script URL switching
- Reusable `loadMidtransScript()` helper function

**Configuration Structure**:
```typescript
// Environment: 'production' or 'sandbox'
export const MIDTRANS_ENVIRONMENT = process.env.NEXT_PUBLIC_MIDTRANS_ENVIRONMENT || 'sandbox';

// Snap Script URLs (auto-switching)
export const MIDTRANS_SNAP_SCRIPT_URL = MIDTRANS_ENVIRONMENT === 'production'
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js';

// Client Keys (centralized)
export const MIDTRANS_CLIENT_KEY = MIDTRANS_ENVIRONMENT === 'production'
  ? 'Mid-client-8GWOB2qNMTVXD6YC'  // Production
  : 'SB-Mid-client-nKMAqVgSgOIsOQyk';  // Sandbox

// Helper function for consistent loading
export const loadMidtransScript = () => Promise<void>
```

**Environment Configuration**:
```bash
# .env.local file
NEXT_PUBLIC_MIDTRANS_ENVIRONMENT=production  # or 'sandbox'
```

**Usage Across Pages**:
All payment pages import and use the centralized configuration:
```typescript
import { loadMidtransScript } from '@/config/midtrans';

useEffect(() => {
  loadMidtransScript().catch((error) => {
    console.error('Failed to load Midtrans script:', error);
  });
}, []);
```

**Pages Using Centralized Config**:
- `/results` - VARK results
- `/ai-knowledge-test-results` - AI Knowledge results
- `/behavioral-test-results` - Behavioral results
- `/comprehensive-test-results` - Comprehensive results
- `/tpa-payment` - TPA payment landing
- `/tpa-test-results` - TPA results

### Dynamic Pricing System

#### Config API Integration
**Purpose**: Centralized pricing management from backend
**Key Features**:
- Single API call on app initialization
- Pricing cached in AuthContext
- Fallback pricing for offline scenarios
- Backend-controlled pricing updates

**Config API Endpoint**:
```
GET /config
```

**Response Structure**:
```typescript
interface ConfigResponse {
  pricing: {
    vark_price: number;              // Default: 30,000
    ai_knowledge_price: number;      // Default: 35,000
    behavioral_learning_price: number; // Default: 40,000
    comprehensive_assessment_price: number; // Default: 45,000
    tpa_price: number;               // Default: 50,000
  }
}
```

**Usage in Components**:
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { config } = useAuth();
const price = config?.pricing.vark_price || 30000;
```

**Benefits**:
- Update pricing without frontend deployment
- Consistent pricing across all pages
- Single point of truth for pricing data
- Graceful degradation with fallback values

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

## Coupon/Voucher System Context

### Overview
The Coupon/Voucher System provides discount functionality across all 5 test types (VARK, AI Knowledge, Behavioral, Comprehensive, TPA), allowing users to apply promotional codes before payment processing.

### Key Components

#### 1. CouponModal Component (`src/components/payment/CouponModal.tsx`)
**Purpose**: Reusable coupon validation interface
**Key Features**:
- Modal-first approach (appears before Midtrans payment)
- Real-time coupon validation with API
- Pricing breakdown display with discount
- Support for all 5 test types
- Error handling for invalid/expired coupons

**Props Interface**:
```typescript
interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedWithoutCoupon: () => void;
  onProceedWithCoupon: (couponData: CouponValidationResponse) => void;
  originalAmount: number;
  testType: 'vark' | 'ai_knowledge' | 'behavioral' | 'comprehensive' | 'tpa';
  validateCoupon: (request: CouponValidationRequest) => Promise<CouponValidationResponse>;
}
```

#### 2. Coupon Validation API
**Purpose**: Validate coupon codes and calculate discounts
**API Endpoint**:
```
POST /users/coupons/validate
```

**Request Structure**:
```typescript
interface CouponValidationRequest {
  code: string;
  test_type: string;
  original_amount: number;
}
```

**Response Structure**:
```typescript
interface CouponValidationResponse {
  valid: boolean;
  coupon: {
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
  };
  final_amount: number;
  discount_amount: number;
  message?: string;
}
```

### Implementation Pattern

#### Standard Payment Flow with Coupon
```typescript
// 1. Show coupon modal on payment button click
const handlePurchaseCertificate = () => setShowCouponModal(true);

// 2. Validate coupon if user enters code
const handleValidateCoupon = async (request: CouponValidationRequest) => {
  const response = await paymentAPI.validateCoupon(request);
  return response.data;
};

// 3. Proceed to payment with optional coupon code
const proceedToPayment = async (couponCode?: string) => {
  // Create order with optional coupon_code parameter
  const paymentResult = await paymentAPI.initialize[TestType]Payment(
    testId,
    couponCode
  );
  // Continue with Midtrans integration...
};
```

### Integration Across Test Types

#### Payment Endpoints with Coupon Support
All test types accept `coupon_code` parameter:
```
POST /users/vark_tests/{id}/orders?coupon_code={code}
POST /users/ai_knowledge_tests/{id}/orders?coupon_code={code}
POST /users/behavioral_learning_tests/{id}/orders?coupon_code={code}
POST /users/comprehensive_assessment_tests/{id}/orders?coupon_code={code}
POST /users/tpa_tests/order?coupon_code={code}
```

#### Usage in Result Pages
- `/results` - VARK results
- `/ai-knowledge-test-results` - AI Knowledge results
- `/behavioral-test-results` - Behavioral results
- `/comprehensive-test-results` - Comprehensive results
- `/tpa-payment` - TPA payment landing

### User Experience Flow

```
User clicks "Get Results" / "Pay Now"
  ↓
CouponModal appears
  ↓
[Option 1] User enters coupon → Validates → Shows discount → Proceeds with coupon
[Option 2] User skips → Proceeds without coupon
  ↓
Order creation with optional coupon_code
  ↓
Midtrans payment with discounted/original amount
  ↓
Payment success → Results unlocked
```

### Features
- ✅ **Test Type Validation**: Coupons can be restricted to specific test types
- ✅ **Discount Types**: Supports percentage and fixed amount discounts
- ✅ **Real-time Validation**: Immediate feedback on coupon validity
- ✅ **Pricing Display**: Clear breakdown of original price, discount, and final price
- ✅ **Error Handling**: User-friendly error messages for invalid codes
- ✅ **Optional Usage**: Users can skip coupon entry and pay full price

---

## Profile Management Context

### Overview
The Profile Management system provides a unified interface for user information, test history across all 5 assessment types, and certificate management.

### Key Components

#### 1. Enhanced Profile Page (`src/app/profile/page.tsx`)
**Purpose**: Comprehensive user profile and test history management
**Key Features**:
- Editable profile information (name, phone, birthday)
- Profile picture upload and management
- Password change functionality
- Unified test history from all assessment types
- Certificate download access
- Payment status tracking
- Responsive design (mobile cards, desktop table)

#### 2. Profile API Integration
**Purpose**: Fetch and update user data
**Key Methods**:
```typescript
// User profile
GET /users/profile - Get user data
PUT /users - Update profile (multipart/form-data for images)

// Test histories (Promise.all with individual error handling)
GET /users/vark_tests - VARK test history
GET /users/ai_knowledge_tests - AI Knowledge history
GET /users/behavioral_learning_tests - Behavioral history
GET /users/comprehensive_assessment_tests - Comprehensive history
GET /users/tpa_tests - TPA test history
```

### Unified Test History Display

#### Test History Structure
The profile page consolidates all test types using:
- **Promise.all()** with individual error handling (one failure doesn't break others)
- **Type conversion utilities** to normalize different test structures
- **Unified interfaces** for consistent display
- **Type badges** for clear test type identification

#### Test History Columns
- **Test Type** - Badge showing VARK/AI Knowledge/Behavioral/Comprehensive/TPA
- **Test Date** - Completion timestamp
- **Status** - Completed/In Progress/Expired
- **Payment & Certificate** - Payment status and download button
- **Actions** - Continue/View Results/Retake buttons

#### Responsive Display
- **Mobile**: Card-based layout with full information
- **Desktop**: Table layout with sortable columns
- **Layout**: 3/4 width for test history, 1/4 width for profile info

### Test History Features

#### Action Buttons
Each test shows context-appropriate actions:
- **Continue Test** - For incomplete tests
- **View Results** - For completed paid tests
- **Pay for Certificate** - For completed unpaid tests
- **Retake Test** - Always available

#### Payment Status Display
Shows payment and certificate status:
- **Paid**: Green badge with download button
- **Pending**: Yellow badge with payment option
- **Not Paid**: Red badge with "Get Certificate" button
- **Certificate Ready**: Direct download link

### Profile Information Management

#### Editable Fields
- **Name**: Text input with validation
- **Phone**: Phone number input
- **Birthday**: Date picker
- **Profile Picture**: Image upload with preview
- **Email**: Display-only (non-editable)
- **Password**: Separate change password component

#### Profile Update Flow
```
User edits field → Form validation → API request → Success feedback
```

### Password Management

#### Change Password Component
**Features**:
- Current password verification
- New password strength validation
- Confirmation password matching
- Secure password update endpoint

**API Endpoint**:
```
PATCH /users/password_change
```

### Integration Points

#### Homepage Navigation
- Profile link in header (authenticated users only)
- User avatar display with automatic fallbacks
- Quick access to user information

#### Test Results Pages
- Links back to profile for test history
- Certificate download integration
- Payment status synchronization

### Data Conversion Pattern

#### Unified Test Interface
```typescript
interface UnifiedTestHistory {
  id: string;
  test_type: 'VARK' | 'AI Knowledge' | 'Behavioral' | 'Comprehensive' | 'TPA';
  created_at: string;
  status: string;
  order?: PaymentOrder;
  payment?: Payment;
}
```

#### Conversion Functions
Each test type has a converter to unified format:
- `convertVarkToUnified(varkTest)` → UnifiedTestHistory
- `convertAiKnowledgeToUnified(aiTest)` → UnifiedTestHistory
- `convertBehavioralToUnified(behavioralTest)` → UnifiedTestHistory
- `convertComprehensiveToUnified(comprehensiveTest)` → UnifiedTestHistory
- `convertTpaToUnified(tpaTest)` → UnifiedTestHistory

### Error Handling

#### Graceful Degradation
- Individual test type API failures don't break entire page
- Displays available test histories even if some APIs fail
- Clear error messaging per test type
- Partial data display when some APIs unavailable

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
- Scalable for unlimited test types

**Props Interface** (Updated for Scalability):
```tsx
interface HeaderProps {
  currentPage?: string; // Accept any string for unlimited test types
  transparent?: boolean;
}
```

**Usage Pattern**:
```tsx
<Header currentPage="test" transparent={true} />
<Header currentPage="ai-knowledge-test" transparent={false} />
<Header currentPage="future-test-type" transparent={true} />
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

#### AI Knowledge API (`src/lib/api/aiKnowledge.ts`)
**Endpoints**:
- `GET /users/ai_knowledge_tests/active_question_set` - Active AI questions
- `POST /users/ai_knowledge_tests` - Create AI test (with `ai_knowledge_question_set_id`)
- `GET /users/ai_knowledge_tests/:id` - Get AI test
- `POST /users/ai_knowledge_tests/:id/submit_answers` - Submit AI answers
- `GET /users/ai_knowledge_tests/:id/results` - Get AI results (8-dimension scoring)

#### Behavioral API (`src/lib/api/behavioral.ts`)
**Endpoints**:
- `GET /users/behavioral_tests/active_question_set` - Active behavioral questions
- `POST /users/behavioral_tests` - Create behavioral test
- `GET /users/behavioral_tests/:id` - Get behavioral test
- `POST /users/behavioral_tests/:id/submit_answers` - Submit behavioral answers
- `GET /users/behavioral_tests/:id/results` - Get behavioral results (4-dimension scoring)

#### Comprehensive API (`src/lib/api/comprehensive.ts`)
**Endpoints**:
- `GET /users/comprehensive_tests/active_question_set` - Active comprehensive questions
- `POST /users/comprehensive_tests` - Create comprehensive test
- `GET /users/comprehensive_tests/:id` - Get comprehensive test
- `POST /users/comprehensive_tests/:id/submit_answers` - Submit comprehensive answers
- `GET /users/comprehensive_tests/:id/results` - Get comprehensive results (5-dimension scoring)

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

### Recent API Improvements (2025-09-27)

#### Test Results Endpoint Consistency Fix
**Issue**: AI Knowledge, Behavioral, and Comprehensive test result pages were using hardcoded `'latest'` instead of specific test IDs from URL parameters, inconsistent with VARK pattern.

**Files Modified**:
- `/src/app/ai-knowledge-test-results/page.tsx:416` - Fixed to use testId from URL params
- `/src/app/behavioral-test-results/page.tsx:424` - Fixed to use testId from URL params
- `/src/app/comprehensive-test-results/page.tsx:103` - Fixed to use testId from URL params

**Pattern Established**:
```typescript
// Correct pattern (now consistent across all test types)
const loadResults = useCallback(async () => {
  // Get test ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const testId = urlParams.get('testId');

  if (!testId) {
    setResultsState(prev => ({
      ...prev,
      isLoading: false,
      error: 'Test ID not found. Cannot load results.'
    }));
    return;
  }

  // Use specific test ID instead of 'latest'
  const results = await [testAPI].getTestResults(testId);
}, [user]);
```

**API Calls Now Consistent**:
- ✅ VARK: `/users/vark_tests/{testId}/results`
- ✅ AI Knowledge: `/users/ai_knowledge_tests/{testId}/results`
- ✅ Behavioral: `/users/behavioral_tests/{testId}/results`
- ✅ Comprehensive: `/users/comprehensive_tests/{testId}/results`

#### API Response Structure Fix (2025-09-27)
**Issue**: AI Knowledge API returned different field names and data types than frontend expected, causing `.toFixed()` errors.

**Root Problem**:
```typescript
// API Response (actual)
{
  "performance_expectancy_score": "13.2",  // String + full name
  "effort_expectancy_score": "7.4",       // String + full name
  // ...
}

// Frontend Expected (types.ts)
{
  pe_score: number,  // Number + abbreviated name
  ee_score: number,  // Number + abbreviated name
  // ...
}
```

**Fix Applied in `/src/lib/api/aiKnowledge.ts:95-102`**:
```typescript
// Map full field names to abbreviated names and convert strings to numbers
pe_score: typeof rawData.performance_expectancy_score === 'string'
  ? parseFloat(rawData.performance_expectancy_score)
  : rawData.performance_expectancy_score || 0,
ee_score: typeof rawData.effort_expectancy_score === 'string'
  ? parseFloat(rawData.effort_expectancy_score)
  : rawData.effort_expectancy_score || 0,
// ... similar for all 8 dimensions
```

**Additional Null Safety Added**:
- All `.toFixed()` calls now use `score?.toFixed(1) || '0.0'` pattern
- Score calculations include fallbacks: `resultsData!.pe_score || 0`
- Max score protection: `resultsData!.max_score || 1`

**Files Updated**:
- `/src/lib/api/aiKnowledge.ts` - Field mapping and type conversion
- `/src/app/ai-knowledge-test-results/page.tsx` - Null safety checks
- `/src/app/behavioral-test-results/page.tsx` - Null safety checks
- `/src/app/comprehensive-test-results/page.tsx` - Null safety checks

### Extension Points

#### Adding New API Endpoints
1. **Create new service file** in `src/lib/api/`
2. **Define TypeScript interfaces** for requests/responses
3. **Add error handling** for specific endpoint errors
4. **Export from api index** for easy imports
5. **Follow established URL parameter pattern** for result pages

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

## Documentation Maintenance Process

### Overview
This section establishes a systematic process for maintaining the FEATURE_CONTEXTS.md documentation as the codebase evolves, ensuring that documentation remains accurate, comprehensive, and useful for development.

### Documentation Update Requirements

#### When to Update Documentation
Documentation MUST be updated in the following scenarios:

1. **New Feature Implementation**
   - Any new major feature or system component
   - New API endpoints or services
   - New UI components or patterns
   - New architectural patterns or approaches

2. **Significant Feature Modifications**
   - Changes to existing API interfaces
   - Updates to component props or behaviors
   - Modifications to data models or types
   - Changes to authentication or authorization flows

3. **Architectural Changes**
   - New design patterns introduced
   - Changes to project structure
   - Updates to development workflow
   - New technology integrations

4. **Bug Fixes with Architectural Impact**
   - Fixes that change component interfaces
   - Fixes that introduce new patterns
   - Fixes that affect multiple features

### Documentation Update Process

#### 1. Feature Context Addition Process
When implementing new features (like AI Knowledge Test), follow this checklist:

- [ ] **Create comprehensive feature section** following existing section patterns
- [ ] **Update Table of Contents** with new section links
- [ ] **Document all key components** with purpose, features, and usage patterns
- [ ] **Include data models and interfaces** with TypeScript examples
- [ ] **Document API endpoints** and communication patterns
- [ ] **Explain integration points** with existing features
- [ ] **Provide extension points** for future development
- [ ] **Add architectural patterns** that can be reused

#### 2. Existing Section Updates
When modifying existing features, update relevant sections:

- [ ] **Component interfaces** - Update props, methods, and usage patterns
- [ ] **API documentation** - Add new endpoints or modify existing ones
- [ ] **Data models** - Update TypeScript interfaces and structures
- [ ] **Integration points** - Document new connections between features
- [ ] **Extension points** - Update guidance for future modifications

#### 3. Cross-Reference Updates
Ensure consistency across related sections:

- [ ] **Check dependencies** - Update sections that reference modified features
- [ ] **Verify examples** - Ensure code examples remain accurate
- [ ] **Update patterns** - Document new patterns introduced
- [ ] **Check navigation** - Ensure internal links remain valid

### Documentation Standards

#### Section Structure Template
Follow this template for new feature contexts:

```markdown
## [Feature Name] Context

### Overview
Brief description of the feature's purpose and architecture

### Key Components
#### 1. Component Name (`file/path`)
**Purpose**: What this component does
**Key Features**:
- Feature list with specific capabilities
- Technical details and patterns

**Usage Pattern**:
```tsx
// Code example showing typical usage
```

### Data Models
TypeScript interfaces and data structures

### Data Flow Architecture
Diagrams and flow descriptions

### Integration Points
How this feature connects to other systems

### Extension Points
Guidelines for future modifications

### Development Considerations
Special requirements, patterns, or gotchas
```

#### Code Documentation Standards
- **Always include TypeScript interfaces** for data structures
- **Provide usage examples** for components and functions
- **Document API endpoints** with request/response patterns
- **Include error handling patterns** where applicable
- **Show integration examples** with other features

#### Cross-Reference Standards
- **Link to specific files** with relative paths
- **Reference line numbers** when pointing to specific implementations
- **Use consistent terminology** across all sections
- **Maintain alphabetical ordering** where applicable

### Automation and Reminders

#### Development Workflow Integration
To ensure documentation stays current:

1. **Pre-commit Reminder**: Developers should check if their changes require documentation updates
2. **Pull Request Template**: Include documentation update checklist
3. **Code Review Process**: Reviewers should verify documentation completeness
4. **Feature Completion Definition**: No feature is complete without documentation updates

#### Documentation Review Process
Quarterly review process:

1. **Accuracy Review**: Verify all documented patterns match current implementation
2. **Completeness Review**: Identify missing documentation for recent features
3. **Clarity Review**: Improve explanations and examples based on developer feedback
4. **Structure Review**: Reorganize sections for better developer experience

### Maintenance Responsibilities

#### Developer Responsibilities
- **Update documentation** for all feature changes
- **Follow established patterns** in documentation structure
- **Include complete examples** and TypeScript interfaces
- **Test documentation accuracy** against actual implementation

#### Code Review Responsibilities
- **Verify documentation updates** are included with feature changes
- **Check for consistency** with existing documentation patterns
- **Ensure completeness** of new feature documentation
- **Validate accuracy** of code examples and interfaces

#### Project Maintenance
- **Regular documentation audits** to identify gaps or inconsistencies
- **Template updates** as project patterns evolve
- **Cross-reference validation** to ensure internal links remain valid
- **Version synchronization** between code and documentation

### Success Metrics

#### Documentation Quality Indicators
- **Developer onboarding time** - How quickly new developers can understand features
- **Feature implementation speed** - How efficiently developers can add new features
- **Bug reduction** - Fewer bugs due to misunderstood patterns or interfaces
- **Code consistency** - More consistent implementation patterns across features

#### Maintenance Success Indicators
- **Documentation freshness** - Percentage of features with up-to-date documentation
- **Coverage completeness** - All major features have comprehensive documentation
- **Cross-reference accuracy** - All internal links and references remain valid
- **Developer satisfaction** - Positive feedback on documentation usefulness

### Tools and Automation

#### Recommended Tools
- **Markdown linters** for consistency and formatting
- **Link checkers** for validating internal references
- **TypeScript extractors** for automatic interface documentation
- **Workflow automation** for documentation update reminders

#### Future Enhancements
- **Automated section generation** from TypeScript interfaces
- **Documentation testing** to verify code examples remain valid
- **Integration with development tools** for automatic update notifications
- **Version tracking** for documentation changes alongside code changes

---

## Midtrans Payment Integration Implementation

### Overview
This section documents the comprehensive Midtrans payment integration implementation for AI Knowledge, Behavioral, and Comprehensive test results. This implementation was added to match the existing VARK payment flow pattern, providing consistent payment experience across all test types.

### Payment Architecture

#### Core Payment Flow
1. **Create Order** → **Get Payment Token** → **Midtrans Snap Popup** → **Payment Verification** → **Result Unlocking**

#### Payment API Structure (`/src/lib/api/payment.ts`)
The payment API follows a consistent pattern for all test types:

**VARK (Reference Implementation):**
- `createVarkOrder(testId)` - Creates payment order
- `getVarkPaymentToken(testId)` - Generates Snap token
- `initializeVarkPayment(testId)` - Combined helper method

**AI Knowledge:**
- `createAiKnowledgeOrder(testId)` - `/users/ai_knowledge_tests/${testId}/orders`
- `getAiKnowledgePaymentToken(testId)` - `/users/ai_knowledge_tests/${testId}/orders/payment_token`
- `initializeAiKnowledgePayment(testId)` - Combined helper method

**Behavioral:**
- `createBehavioralOrder(testId)` - `/users/behavioral_learning_tests/${testId}/orders`
- `getBehavioralPaymentToken(testId)` - `/users/behavioral_learning_tests/${testId}/orders/payment_token`
- `initializeBehavioralPayment(testId)` - Combined helper method

**Comprehensive:**
- `createComprehensiveOrder(testId)` - `/users/comprehensive_assessment_tests/${testId}/orders`
- `getComprehensivePaymentToken(testId)` - `/users/comprehensive_assessment_tests/${testId}/orders/payment_token`
- `initializeComprehensivePayment(testId)` - Combined helper method

### Result Page Implementation Pattern

#### Common Components Added to Each Result Page
1. **Midtrans Type Definitions**:
   ```typescript
   interface MidtransResult {
     transaction_id: string;
     payment_type: string;
     status_message: string;
   }

   interface OrderError extends Error {
     response?: {
       data?: {
         code?: string;
         message?: string;
       };
     };
   }
   ```

2. **Payment State Management**:
   ```typescript
   const [isPaid, setIsPaid] = useState(false);
   const [isProcessingPayment, setIsProcessingPayment] = useState(false);
   const [snapUrl, setSnapUrl] = useState<string | null>(null);
   const [showPaymentSuccessDialog, setShowPaymentSuccessDialog] = useState(false);
   ```

3. **Payment Status Checking Function**:
   - Checks payment status via API endpoint: `/users/[test_type]/${testId}/check_payment_status`
   - Uses authentication token from cookies
   - Automatically updates `isPaid` state when payment is detected
   - Shows success dialog on auto-detection

4. **Midtrans Script Loading**:
   - Loads Midtrans Snap script from CDN
   - Uses sandbox client key: `SB-Mid-client-nKMAqVgSgOIsOQyk`
   - Prevents duplicate script loading

5. **Snap Popup Integration**:
   - Handles success, pending, error, and close events
   - Automatically checks payment status after events
   - Falls back to external window if Snap fails to load
   - Implements polling for payment completion detection

6. **Payment Purchase Handler**:
   - Extracts testId from URL parameters
   - Creates order and gets payment token
   - Handles existing order scenarios gracefully
   - Opens Snap popup with proper error handling

7. **PaymentSuccessDialog Component**:
   - Consistent success dialog across all test types
   - Options to download certificate or continue viewing results
   - Proper close button and overlay handling

### Implementation Files Modified

#### 1. `/src/lib/api/payment.ts`
- Added 9 new payment methods (3 per test type)
- All methods follow the same pattern as VARK implementation
- Proper TypeScript typing with existing PaymentOrder and PaymentToken types

#### 2. `/src/app/ai-knowledge-test-results/page.tsx`
- Replaced mock `setTimeout` payment with real Midtrans integration
- Added comprehensive payment status checking
- Implements complete payment flow with error handling

#### 3. `/src/app/behavioral-test-results/page.tsx`
- Same implementation pattern as AI Knowledge
- Uses Behavioral-specific API endpoints
- Consistent user experience with other test types

#### 4. `/src/app/comprehensive-test-results/page.tsx`
- Same implementation pattern as AI Knowledge and Behavioral
- Uses Comprehensive-specific API endpoints
- Maintains pricing difference (50,000 IDR vs 30,000 IDR)

### Key Implementation Details

#### Error Handling
- **Existing Order Scenario**: When user already created an order, gracefully gets existing payment token instead of creating new order
- **Network Errors**: Proper error messages and fallback handling
- **Payment Failures**: Clear user feedback with retry options
- **Token Errors**: Handles authentication and authorization issues

#### Payment Status Detection
- **Auto-checking**: Automatically checks payment status after Snap events
- **Polling**: For external payment windows, polls status every 10 seconds
- **Timeout**: Stops polling after 10 minutes to prevent infinite loops
- **Real-time Updates**: Updates UI immediately when payment is detected

#### Security Considerations
- **Token-based Authentication**: Uses HTTP-only cookies for auth tokens
- **CORS Handling**: Proper API endpoint configuration
- **Client-side Validation**: Validates testId and user authentication
- **Secure Redirects**: Uses HTTPS endpoints for payment processing

#### Pricing Structure
- **AI Knowledge**: Rp. 30,000
- **Behavioral**: Rp. 30,000
- **Comprehensive**: Rp. 50,000
- **VARK**: Rp. 30,000

### Testing Considerations

#### Test Endpoints to Use
- AI Knowledge: `/users/ai_knowledge_tests/${testId}/orders`
- Behavioral: `/users/behavioral_learning_tests/${testId}/orders`
- Comprehensive: `/users/comprehensive_assessment_tests/${testId}/orders`

#### Sandbox Environment
- Uses Midtrans sandbox for development/testing
- Client key: `SB-Mid-client-nKMAqVgSgOIsOQyk`
- All test transactions use sandbox environment

#### Manual Testing Scenarios
1. **New Payment**: Create order → get token → complete payment → verify results unlock
2. **Existing Order**: Attempt payment with existing order → verify token retrieval
3. **Payment Cancellation**: Close Snap popup → verify status checking continues
4. **Network Issues**: Test with poor connectivity → verify error handling
5. **Authentication Issues**: Test with expired tokens → verify error messages

### Future Enhancements

#### Potential Improvements
- **Payment History**: Add payment history tracking
- **Multiple Payment Methods**: Support for different payment types
- **Automatic Retry**: Implement automatic retry for failed payments
- **Payment Analytics**: Add payment completion tracking
- **Certificate Integration**: Direct certificate generation after payment

#### API Optimizations
- **Caching**: Implement payment status caching to reduce API calls
- **Webhooks**: Add Midtrans webhook integration for real-time updates
- **Batch Operations**: Support for bulk payment status checking
- **Payment Scheduling**: Add support for scheduled or recurring payments

---

## Conclusion

This feature context documentation provides a comprehensive guide for understanding and extending the Cakravia application. Each feature is designed with clear separation of concerns, consistent patterns, and extensible architecture.

When adding new features or modifying existing ones, refer to the specific feature contexts and follow the established patterns for maintainable, scalable code. Always update this documentation as part of your development process to ensure it remains a valuable resource for the entire team.

For questions or clarifications about any feature context, refer to the specific component files and their inline documentation.

---

## Documentation Version History

### Version 3.0 - November 4, 2025
**Major Updates:**
- ✅ Added **Behavioral Test System Context** - 4-dimension behavioral assessment
- ✅ Added **Comprehensive Test System Context** - 5-dimension comprehensive assessment
- ✅ Added **TPA Assessment System Context** - Payment-first cognitive reasoning assessment
- ✅ Added **Coupon/Voucher System Context** - Discount system across all 5 test types
- ✅ Added **Profile Management Context** - Unified test history and user management
- ✅ Updated **Payment Integration Context** with:
  - Centralized Midtrans configuration (`src/config/midtrans.ts`)
  - Dynamic pricing system via Config API
  - Environment-aware setup (production/sandbox)
  - Comprehensive payment flow documentation for all test types
- ✅ Updated Table of Contents with all new sections
- ✅ Complete alignment with claude-context.md v1.7

**Codebase Improvements Documented:**
- Centralized Midtrans configuration file
- Dynamic pricing loaded from backend
- 5 complete assessment types (VARK, AI Knowledge, Behavioral, Comprehensive, TPA)
- Unified profile page with all test histories
- Comprehensive coupon system integration
- Payment-first vs payment-after architectures

### Version 2.0 - September 27, 2025
**Updates:**
- Added AI Knowledge Test System Context with 8-dimension assessment
- Updated API Architecture Context with test results endpoint consistency fixes
- Added API response structure fix documentation
- Documented data conversion patterns and null safety improvements
- Added Midtrans Payment Integration Implementation section

### Version 1.0 - Initial Release
**Initial Sections:**
- Project Overview
- Authentication System Context
- VARK Test System Context
- Payment Integration Context (basic)
- UI/Component System Context
- API Architecture Context
- Development Guidelines
- Documentation Maintenance Process

---

**Current Version**: 3.0
**Last Updated**: November 4, 2025
**Total Test Types**: 5 (VARK, AI Knowledge, Behavioral, Comprehensive, TPA)
**Total Features Documented**: 10+ major features

---

## Quick Reference Card

### All Assessment Types
1. **VARK** - Learning styles (Visual, Aural, Read/Write, Kinesthetic) - Rp. 30,000
2. **AI Knowledge** - AI attitudes (8 dimensions) - Rp. 35,000
3. **Behavioral** - Behavioral learning (4 dimensions) - Rp. 40,000
4. **Comprehensive** - Complete profile (5 dimensions) - Rp. 45,000
5. **TPA** - Cognitive reasoning (4 dimensions) - Rp. 50,000 (payment-first)

### Key Configuration Files
- **Midtrans Config**: `src/config/midtrans.ts` - Payment gateway settings
- **API Client**: `src/lib/api/client.ts` - HTTP client configuration
- **Types**: `src/lib/types.ts` - All TypeScript interfaces
- **Auth Context**: `src/contexts/AuthContext.tsx` - Global auth + config state

### Payment Models
- **Payment-After**: VARK, AI Knowledge, Behavioral, Comprehensive (Test → Results → Pay → Certificate)
- **Payment-First**: TPA (Pay → Test → Results + Certificate)

### Common Tasks Quick Links
- **Add new test type**: See AI Knowledge Test System Context
- **Modify payment**: See Payment Integration Context + Centralized Midtrans Config
- **Update pricing**: Config API endpoint (`GET /config`)
- **Add coupon**: See Coupon/Voucher System Context
- **Profile integration**: See Profile Management Context
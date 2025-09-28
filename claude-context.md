# PROJECT FEATURE CONTEXT - CAKRAVIA

You are working on this web development project. Before making any changes or suggestions, always reference this feature context to understand existing functionality and prevent redundancy.

## GLOBAL CONTEXT
```
TECH_STACK: Next.js 15.3.4, TypeScript, Tailwind CSS, Radix UI, Axios, React 19, Lucide Icons
ARCHITECTURE: Next.js App Router with server/client components
STATE_MANAGEMENT: React Context (AuthContext) + localStorage for test progress
STYLING: Tailwind CSS with custom design system (#2A3262, #ABD305, #DFE4FF)
AUTH_SYSTEM: Email/password + Google Sign-In with cross-authentication support
DATABASE: Remote API at https://api.cakravia.com/api/v1
PROJECT_STRUCTURE: /src/app (pages), /src/components (reusable), /src/lib (utilities/API), /src/contexts
API_DOCUMENTATION: /temporer folder for claude (Postman collections, API docs, UI mockups)
```

## ACTIVE FEATURES

### FEATURE_1: VARK Learning Style Assessment
**STATUS:** ACTIVE | **PRIORITY:** HIGH | **COMPLEXITY:** 4

**PURPOSE:** Assess learning preferences across Visual, Aural, Read/Write, and Kinesthetic dimensions
**USER_STORY:** As a user, I want to discover my learning style preferences so that I can optimize my study methods

**MAIN_FLOW:**
1. User navigates to `/test` or starts from homepage
2. System fetches active question set and creates test session
3. Chat-based interface with slider input for answers (1.0 to max_weight scale)
4. Progress saved to localStorage for cross-device continuation
5. Auto-submit on completion or timer expiration
6. Results processing with learning style breakdown and recommendations
7. Optional payment for certificate generation (with coupon/voucher support)

**API_ENDPOINTS:**
- GET `/users/vark_tests/active_question_set` - Fetch question set
- POST `/users/vark_tests` - Create test session
- GET `/users/vark_tests/{id}` - Resume test
- POST `/users/vark_tests/{id}/submit_answers` - Submit responses
- GET `/users/vark_tests/{id}/results` - Get results
- POST `/users/vark_tests/{id}/orders` - Payment processing (supports coupon_code)

**COMPONENTS:**
- PRIMARY: VarkTestFlow → Main test orchestration with chat interface
- SHARED: Header, Footer, CrossDeviceWarning → Consistent across platform
- UI: Button, Card, Progress, ScrollArea, Slider → Radix-based components

**ROUTES:**
- `/test` - Main VARK test interface
- `/results?testId={id}` - VARK results display
- `/test-vark` - Testing environment

**DEPENDENCIES:**
- REQUIRES: AuthContext, API client, localStorage progress manager
- USED_BY: Profile page (test history), Homepage (navigation)
- EXTERNAL: Axios, js-cookie, Radix UI components

**HOOKS/UTILITIES:**
- useAuth() - Authentication state
- VarkTestProgressManager - localStorage persistence
- useCallback, useEffect - Performance optimization

---

### FEATURE_2: AI Knowledge Assessment
**STATUS:** ACTIVE | **PRIORITY:** HIGH | **COMPLEXITY:** 4

**PURPOSE:** Evaluate attitudes toward AI usage across 8 psychological dimensions (PE, EE, SI, FC, HM, PV, HT, BI)
**USER_STORY:** As a user, I want to understand my AI readiness and attitudes so that I can better integrate AI tools in my learning

**MAIN_FLOW:**
1. User accesses `/ai-knowledge-test`
2. System creates AI knowledge test session
3. Chat-based interface with 8-category questions
4. Slider responses for agreement levels (1-5 scale typically)
5. Progress tracking with localStorage backup
6. Submission and processing of AI readiness profile
7. Results showing dominant categories and recommendations
8. Optional payment with coupon/voucher modal for certificates

**API_ENDPOINTS:**
- GET `/users/ai_knowledge_tests/active_question_set` - Question set
- POST `/users/ai_knowledge_tests` - Create session
- GET `/users/ai_knowledge_tests/{id}` - Resume test
- POST `/users/ai_knowledge_tests/{id}/submit_answers` - Submit
- GET `/users/ai_knowledge_tests/{id}/results` - Results
- POST `/users/ai_knowledge_tests/{id}/orders` - Payment (supports coupon_code)

**COMPONENTS:**
- PRIMARY: AiKnowledgeTestInterface → Chat-based test flow
- SHARED: Header, CrossDeviceWarning, test UI components
- UI: Custom slider components, progress indicators

**ROUTES:**
- `/ai-knowledge-test` - Main AI assessment
- `/ai-knowledge-test-results?testId={id}` - Results page
- `/ai-knowledge-test-results-mock` - Mock results for testing

**DEPENDENCIES:**
- REQUIRES: AuthContext, comprehensive API client
- USED_BY: Profile unified test history
- EXTERNAL: Similar to VARK but different scoring algorithm

**HOOKS/UTILITIES:**
- AiKnowledgeTestProgressManager - Progress persistence
- aiKnowledgeAPI - Dedicated API functions

---

### FEATURE_3: Behavioral Assessment
**STATUS:** ACTIVE | **PRIORITY:** HIGH | **COMPLEXITY:** 4

**PURPOSE:** Analyze behavioral patterns across 4 dimensions (H-Habits, M-Motivation, R-Regulation, E-Engagement)
**USER_STORY:** As a user, I want to understand my behavioral learning patterns so that I can improve my study habits

**MAIN_FLOW:**
1. Access `/behavioral-test` for assessment start
2. Create behavioral test session with time limits
3. Answer behavioral dimension questions via chat interface
4. Track responses across 4 key behavioral areas
5. Submit for behavioral profile analysis
6. Receive behavioral insights and improvement recommendations
7. Optional payment with coupon/voucher modal for certificates

**API_ENDPOINTS:**
- GET `/users/behavioral_learning_tests/active_question_set`
- POST `/users/behavioral_learning_tests` - Create session
- GET `/users/behavioral_learning_tests/{id}` - Test retrieval
- POST `/users/behavioral_learning_tests/{id}/submit_answers`
- GET `/users/behavioral_learning_tests/{id}/results`
- POST `/users/behavioral_learning_tests/{id}/orders` - Payment (supports coupon_code)

**COMPONENTS:**
- PRIMARY: BehavioralTestInterface → Behavioral assessment flow
- SHARED: Consistent chat UI pattern, cross-device support
- UI: Behavioral-specific slider components and progress tracking

**ROUTES:**
- `/behavioral-test` - Main behavioral assessment
- `/behavioral-test-results?testId={id}` - Results display
- `/behavioral-test-results-mock` - Testing environment

**DEPENDENCIES:**
- REQUIRES: AuthContext, behavioral API endpoints
- USED_BY: Profile page unified history
- EXTERNAL: LocalStorage for progress, Midtrans for payments

**HOOKS/UTILITIES:**
- BehavioralTestProgressManager - Session persistence
- behavioralAPI - Dedicated API layer

---

### FEATURE_4: Comprehensive Assessment
**STATUS:** ACTIVE | **PRIORITY:** HIGH | **COMPLEXITY:** 5

**PURPOSE:** Combined assessment integrating VARK, AI Knowledge, and Behavioral dimensions for complete profile
**USER_STORY:** As a user, I want a complete learning assessment so that I get a holistic understanding of my learning profile

**MAIN_FLOW:**
1. Start comprehensive assessment via `/comprehensive-test`
2. Extended test session combining all assessment types
3. Questions span multiple assessment categories with type indicators
4. Longer time limits (typically 1.5 hours default)
5. Comprehensive scoring across 5 dimensions (CF, R, MA, AG, E)
6. Detailed profile analysis combining all assessment insights
7. Optional payment with coupon/voucher modal for certificates

**API_ENDPOINTS:**
- GET `/users/comprehensive_assessment_tests/active_question_set`
- POST `/users/comprehensive_assessment_tests` - Session creation
- GET `/users/comprehensive_assessment_tests/{id}` - Resume
- POST `/users/comprehensive_assessment_tests/{id}/submit_answers`
- GET `/users/comprehensive_assessment_tests/{id}/results`
- POST `/users/comprehensive_assessment_tests/{id}/orders` - Payment (supports coupon_code)

**COMPONENTS:**
- PRIMARY: ComprehensiveTestInterface → Extended test flow
- SHARED: Enhanced chat interface with category type indicators
- UI: Multi-type question display, extended progress tracking

**ROUTES:**
- `/comprehensive-test` - Main comprehensive assessment
- `/comprehensive-test-results?testId={id}` - Complete results
- `/comprehensive-test-results-mock` - Testing interface

**DEPENDENCIES:**
- REQUIRES: All previous test type dependencies
- USED_BY: Profile page as premium assessment option
- EXTERNAL: Extended localStorage, comprehensive payment processing

**HOOKS/UTILITIES:**
- ComprehensiveTestProgressManager - Multi-type progress
- comprehensiveAPI - Complex assessment API layer

---

### FEATURE_5: TPA Assessment (Payment-First)
**STATUS:** ACTIVE | **PRIORITY:** HIGH | **COMPLEXITY:** 5

**PURPOSE:** Test of Potential Ability - Comprehensive reasoning assessment across 4 cognitive dimensions with payment-first architecture
**USER_STORY:** As a user, I want to take a professional TPA assessment after completing payment so that I can get an official cognitive ability evaluation with certificate

**MAIN_FLOW:**
1. User discovers TPA from homepage → redirected to `/tpa-payment` (payment landing page)
2. Payment-first architecture: User must complete payment before test access
3. CouponModal integration for voucher/discount codes (same system as other tests)
4. Midtrans payment processing with 50,000 IDR pricing (vs 30,000 IDR for other tests)
5. After payment success → redirect to `/tpa-test?orderId={id}` (test interface)
6. Payment validation before test creation (order must be 'paid' status)
7. Test interface: 4 reasoning categories (Analytical, Quantitative, Spatial, Verbal) - 5 questions each
8. Results display with immediate certificate download (no additional payment)

**PAYMENT-FIRST ARCHITECTURE:**
- **Order Creation**: `POST /users/tpa_tests/order` (with optional coupon_code)
- **Payment Processing**: Midtrans integration with order validation
- **Test Creation**: `POST /users/tpa_tests` (requires paid order_id)
- **Access Control**: Test interface validates payment before allowing access

**API_ENDPOINTS:**
- GET `/users/tpa_tests/active_question_set` - Question set retrieval
- POST `/users/tpa_tests/order` - Create standalone order (payment-first)
- POST `/users/tpa_tests` - Create test (requires order_id from paid order)
- GET `/users/tpa_tests/{id}` - Resume test session
- POST `/users/tpa_tests/{id}/submit_answers` - Submit responses
- GET `/users/tpa_tests/{id}/results` - Get reasoning profile results
- POST `/users/tpa_tests/{id}/orders/payment_token` - Payment token (for existing orders)

**COMPONENTS:**
- PRIMARY: TpaPaymentLanding → Payment-first landing page with coupon integration
- PRIMARY: TpaTestInterface → Reasoning assessment with payment validation
- PRIMARY: TpaResultsPage → Results display with direct certificate download
- SHARED: CouponModal (updated to support 'tpa' test type)
- UI: Payment validation, order status checking, 4-category result display

**ROUTES:**
- `/tpa-payment` - Payment-first landing page (entry point)
- `/tpa-test?orderId={id}` - Test interface (requires paid order)
- `/tpa-test-results?testId={id}` - Results with certificate download
- `/tpa-test?resumeTestId={id}` - Resume existing test session

**DEPENDENCIES:**
- REQUIRES: Enhanced payment API with standalone order creation
- REQUIRES: CouponModal component (extended for TPA support)
- REQUIRES: Order validation logic before test access
- USED_BY: Homepage navigation, Profile page (test history integration)
- EXTERNAL: Midtrans payment, TPA question set management

**HOOKS/UTILITIES:**
- tpaAPI.startPaymentFlow() - Create order with optional coupon
- tpaAPI.startTestFlow() - Create test with paid order validation
- tpaAPI.validateOrderPayment() - Check payment status
- paymentAPI.createTpaStandaloneOrder() - Order creation with coupon support
- TpaTestProgressManager - Session persistence (same pattern as other tests)

**KEY_DIFFERENCES_FROM_OTHER_TESTS:**
- **Payment-first**: Must pay before test access (vs pay-after-results for others)
- **Higher pricing**: 50,000 IDR vs 30,000 IDR for VARK/AI/Behavioral/Comprehensive
- **Direct certificate**: No additional payment step on results page
- **Order validation**: Test creation requires validated paid order_id
- **Separate landing**: `/tpa-payment` entry point vs direct test access

---

### FEATURE_6: User Authentication System
**STATUS:** ACTIVE | **PRIORITY:** CRITICAL | **COMPLEXITY:** 4

**PURPOSE:** Secure user authentication with email/password and Google Sign-In integration
**USER_STORY:** As a user, I want to securely access my account so that I can track my assessment progress

**MAIN_FLOW:**
1. User registration with email/password validation
2. Email/password login with cross-authentication detection
3. Google Sign-In integration with account linking
4. Cross-device authentication warnings and recovery
5. Password reset and change functionality
6. Session management with HTTP-only cookies

**API_ENDPOINTS:**
- POST `/users/register` - User registration
- POST `/users/login` - Email/password authentication
- POST `/users/google_login` - Google authentication
- POST `/users/password_reset` - Password reset request
- POST `/users/password_reset_confirm` - Reset confirmation
- PATCH `/users/password_change` - Password update
- GET `/users/profile` - User profile data

**COMPONENTS:**
- PRIMARY: AuthContext → Global authentication state
- SHARED: GoogleSignInButton, ProtectedRoute → Auth utilities
- UI: Login forms, registration forms, password change

**ROUTES:**
- `/login` - Main login interface
- `/register` - User registration
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form

**DEPENDENCIES:**
- REQUIRES: Google SDK, js-cookie, form validation
- USED_BY: All protected routes and features
- EXTERNAL: Google OAuth 2.0, HTTP-only cookies

**HOOKS/UTILITIES:**
- useAuth() - Primary authentication hook
- Cross-authentication handling for Google/email conflicts

---

### FEATURE_7: Payment Integration
**STATUS:** ACTIVE | **PRIORITY:** HIGH | **COMPLEXITY:** 3

**PURPOSE:** Midtrans payment gateway integration for premium features and certificates
**USER_STORY:** As a user, I want to purchase certificates for my assessments so that I can validate my learning achievements

**MAIN_FLOW:**
1. Complete assessment (any type)
2. Initiate payment for certificate generation
3. **NEW: Coupon/voucher modal appears for discount application**
4. Create payment order through Midtrans (with optional coupon)
5. Process payment via Midtrans snap interface
6. Verify payment status and update order
7. Generate and download certificate upon successful payment

**API_ENDPOINTS:**
- POST `/users/coupons/validate` - Validate coupon code and get pricing
- POST `/users/{test_type}_tests/{id}/orders` - Create payment order (supports coupon_code)
- POST `/users/{test_type}_tests/{id}/orders/payment_token` - Get payment token
- GET `/users/{test_type}_tests/{id}/orders/download_certificate` - Certificate download

**COMPONENTS:**
- PRIMARY: Payment flow integration in test results
- SHARED: CouponModal, payment status indicators, certificate download buttons
- UI: Coupon validation modal, payment modals, status badges, download interfaces

**ROUTES:**
- `/test-payment` - Payment testing interface
- Payment processing integrated into results pages

**DEPENDENCIES:**
- REQUIRES: Midtrans SDK, payment order management
- USED_BY: All test types for certificate generation
- EXTERNAL: Midtrans payment gateway, certificate generation

**HOOKS/UTILITIES:**
- paymentAPI - Unified payment methods for all test types (with coupon support)
- CouponModal - Reusable coupon validation component
- Payment status tracking and order management

---

### FEATURE_8: Coupon/Voucher System
**STATUS:** ACTIVE | **PRIORITY:** HIGH | **COMPLEXITY:** 3

**PURPOSE:** Discount system allowing users to apply coupon codes for reduced pricing on certificate purchases
**USER_STORY:** As a user, I want to apply coupon codes to get discounts on my certificate purchases so that I can save money

**MAIN_FLOW:**
1. User completes any assessment and clicks payment button
2. CouponModal appears before Midtrans payment interface
3. User can enter coupon code or proceed without coupon
4. System validates coupon code against API
5. Valid coupons show pricing breakdown with discount
6. Payment proceeds to Midtrans with discounted amount
7. Order is created with coupon information applied

**API_ENDPOINTS:**
- POST `/users/coupons/validate` - Validate coupon and calculate discount
- All order endpoints accept optional `coupon_code` parameter

**COMPONENTS:**
- PRIMARY: CouponModal → Reusable coupon validation interface
- SHARED: Applied across all 5 test types (VARK, AI Knowledge, Behavioral, Comprehensive, TPA)
- UI: Modal with input field, validation states, pricing breakdown

**ROUTES:**
- Integrated into all test results pages:
  - `/results?testId={id}` - VARK results
  - `/ai-knowledge-test-results?testId={id}` - AI Knowledge results
  - `/behavioral-test-results?testId={id}` - Behavioral results
  - `/comprehensive-test-results?testId={id}` - Comprehensive results
  - `/tpa-payment` - TPA payment landing (payment-first flow)

**DEPENDENCIES:**
- REQUIRES: paymentAPI, coupon validation endpoint
- USED_BY: All 5 assessment types for certificate purchases (TPA uses payment-first approach)
- EXTERNAL: None (pure frontend integration with existing payment flow)

**HOOKS/UTILITIES:**
- handleValidateCoupon - Async coupon validation function
- handleCouponModalSubmit - Modal completion handler
- proceedToPayment - Enhanced payment with coupon support

**IMPLEMENTATION_PATTERN:**
```typescript
// Standard pattern applied across all test types
const handlePurchaseCertificate = () => setShowCouponModal(true);
const proceedToPayment = (couponCode?: string) => {
  // Payment logic with optional coupon
};
```

---

### FEATURE_9: Profile Management
**STATUS:** ACTIVE | **PRIORITY:** HIGH | **COMPLEXITY:** 4

**PURPOSE:** Comprehensive user profile with unified test history across all assessment types
**USER_STORY:** As a user, I want to manage my profile and view all my test history so that I can track my learning journey

**MAIN_FLOW:**
1. Access profile page with authentication check
2. Display editable profile information (name, phone, birthday)
3. Show unified test history from all assessment types
4. Provide action buttons for continuing, viewing results, or retaking tests
5. Support certificate downloads and payment status
6. Enable profile picture updates and password changes

**API_ENDPOINTS:**
- GET `/users/profile` - Profile data
- PUT `/users` - Profile updates (multipart/form-data)
- GET `/users/vark_tests` - VARK test history
- GET `/users/ai_knowledge_tests` - AI Knowledge history
- GET `/users/behavioral_learning_tests` - Behavioral history
- GET `/users/comprehensive_assessment_tests` - Comprehensive history

**COMPONENTS:**
- PRIMARY: EnhancedProfilePage → Complete profile management
- SHARED: ChangePasswordComponent, profile form components
- UI: Unified test history table/cards, responsive design

**ROUTES:**
- `/profile` - Main profile interface

**DEPENDENCIES:**
- REQUIRES: AuthContext, all test APIs, image upload
- USED_BY: Header navigation, user management
- EXTERNAL: File upload, Promise.all for concurrent API calls

**HOOKS/UTILITIES:**
- Unified test history conversion utilities
- Profile form validation and error handling

---

### FEATURE_10: Homepage & Navigation
**STATUS:** ACTIVE | **PRIORITY:** MEDIUM | **COMPLEXITY:** 3

**PURPOSE:** Landing page with assessment carousel and navigation to test types
**USER_STORY:** As a visitor, I want to understand available assessments so that I can choose the right test for my needs

**MAIN_FLOW:**
1. Display hero section with value proposition
2. Interactive carousel showcasing all assessment types
3. Quick access cards for starting each test type
4. Authentication-aware navigation (login/logout states)
5. Responsive design for mobile and desktop

**API_ENDPOINTS:**
- None directly (navigation to test endpoints)

**COMPONENTS:**
- PRIMARY: EnhancedHomepage → Landing page with carousel
- SHARED: Header, Footer, test cards, carousel navigation
- UI: Responsive carousel, call-to-action buttons

**ROUTES:**
- `/` - Main homepage
- `/about` - About page

**DEPENDENCIES:**
- REQUIRES: AuthContext for state-aware navigation
- USED_BY: SEO and user acquisition
- EXTERNAL: Image optimization, responsive design

**HOOKS/UTILITIES:**
- Carousel state management with auto-advance
- Authentication-aware component rendering

## SHARED RESOURCES

**REUSABLE_COMPONENTS:**
- Header → Navigation with auth state, consistent across all pages
- Footer → Site footer with links and branding
- CouponModal → Coupon validation modal (used across all 4 test types)
- VarkTestFlow → Original VARK test interface (being replaced by unified)
- CrossDeviceWarning → Progress continuation warnings across devices
- ProtectedRoute → Authentication wrapper for protected pages
- GoogleSignInButton → Google OAuth integration
- ChangePasswordComponent → Password change functionality
- UI Components → Button, Card, Progress, ScrollArea, Slider (Radix-based)

**COMMON_HOOKS:**
- useAuth() → Primary authentication hook from AuthContext
- useCallback/useEffect → Performance optimization patterns
- Custom progress managers for each test type

**SHARED_APIS:**
- authAPI → Complete authentication management
- paymentAPI → Payment processing with coupon validation support
- apiClient → Axios instance with token injection and error handling
- Base URL: https://api.cakravia.com/api/v1
- Automatic token management via HTTP-only cookies

**UTILITY_FUNCTIONS:**
- Test progress managers (VarkTestProgressManager, AiKnowledgeTestProgressManager, etc.)
- formatTime, formatDate, formatDuration → Time formatting utilities
- Test type conversion utilities for unified profile display
- Payment initialization methods for all test types (with coupon support)
- Coupon validation and modal handling utilities

## DEVELOPMENT_PATTERNS

**NAMING_CONVENTIONS:**
- Pages: PascalCase with descriptive names (EnhancedProfilePage)
- Components: PascalCase (CrossDeviceWarning, GoogleSignInButton)
- APIs: camelCase with API suffix (authAPI, varkAPI)
- Types: PascalCase interfaces (VarkTest, AiKnowledgeResults)
- Files: kebab-case for pages, PascalCase for components

**CODE_PATTERNS:**
- Error Handling: try/catch with specific error messages, AxiosError typing
- Data Fetching: Axios-based with interceptors for tokens and 401 handling
- Form Handling: Controlled components with validation and error states
- State Updates: Immutable patterns with spread operators
- Progress Persistence: localStorage with versioning and expiration checks
- Authentication: Context-based with automatic redirects
- API Responses: Consistent { data, status, error } format
- Coupon Integration: Modal-first approach before payment processing

**FILE_STRUCTURE_EXAMPLE:**
```
src/
  app/
    (feature-name)/
      page.tsx → Main feature page
    layout.tsx → Global layout
  components/
    ui/ → Radix-based components
    FeatureComponent.tsx → Feature-specific components
  lib/
    api/ → API layer organized by feature
    (feature)Progress.ts → Progress managers
    types.ts → TypeScript interfaces
  contexts/
    AuthContext.tsx → Global state
```

## API DOCUMENTATION RESOURCES

**TEMPORARY_FOLDER:** `/temporer folder for claude/`
**PURPOSE:** API reference materials and development documentation for Claude Code sessions

**CONTENTS:**
- **AI_KNOWLEDGE_TEST_API_DOCS.md** → Comprehensive AI Knowledge API documentation with 8 categories (PE, EE, SI, FC, HM, PV, HT, BI), TypeScript interfaces, and implementation notes
- **Version 1.postman_collection (7).json** → Complete Postman collection with all API endpoints
- **Version 1.postman_collection (8).json** → Updated Postman collection version
- **UI Mockups** → Design references (section 2@2x.png, three combination result v4.png, ss 24 sept no 1.png)

**USAGE_NOTES:**
- **API Format Verification:** Check Postman collections when implementing new API calls
- **Backend Comparison:** Use for comparing current implementation with latest API specs
- **Development Reference:** Consult AI_KNOWLEDGE_TEST_API_DOCS.md for detailed AI assessment implementation
- **Design Reference:** UI mockups provide visual guidance for feature development

**API_PATTERNS_FROM_DOCS:**
- Consistent Bearer token authentication across all endpoints
- Standard `{data, status, error}` response format
- Question structure with `{question_id, category_id, point}` answer format
- UUID-based resource identification
- Time limit and expiration handling patterns

## CRITICAL_ROUTES
- `/` → Homepage (public)
- `/login` → Authentication (public)
- `/test` → VARK Assessment (protected)
- `/ai-knowledge-test` → AI Assessment (protected)
- `/behavioral-test` → Behavioral Assessment (protected)
- `/comprehensive-test` → Comprehensive Assessment (protected)
- `/profile` → User Profile (protected)
- `/results?testId={id}` → VARK Results (protected)

## CHANGE-SPECIFIC PROMPTS

When you encounter specific types of changes, use these targeted prompts to ensure comprehensive implementation:

### **API_CHANGE_PROMPT**
```
When modifying or adding API endpoints:
1. ✅ Check `/temporer folder for claude/` for latest API documentation
2. ✅ Compare current implementation vs Postman collection format
3. ✅ Update corresponding API service file (e.g., authAPI, varkAPI)
4. ✅ Update TypeScript interfaces in src/lib/types.ts
5. ✅ Test API changes with existing error handling patterns
6. ✅ Update affected components that use this API
7. ✅ Check profile page integration if test-related API
8. ✅ Update context documentation if major API change
```

### **FEATURE_ADDITION_PROMPT**
```
When adding a completely new feature:
1. ✅ Review ACTIVE_FEATURES to avoid duplication
2. ✅ Check SHARED_RESOURCES for reusable components
3. ✅ Follow PROJECT_STRUCTURE conventions for file placement
4. ✅ Implement using established DEVELOPMENT_PATTERNS
5. ✅ Add to Header navigation if user-facing
6. ✅ Integrate with AuthContext if authentication required
7. ✅ Add route to CRITICAL_ROUTES section
8. ✅ Update unified profile if generates user data
9. ✅ Document in claude-context.md ACTIVE_FEATURES
```

### **ASSESSMENT_TYPE_PROMPT**
```
When adding a new assessment type (5th test type):
1. ✅ Follow existing assessment patterns (chat interface, sliders)
2. ✅ Create API service following varkAPI/aiKnowledgeAPI pattern
3. ✅ Implement progress manager for localStorage persistence
4. ✅ Add to unified profile display with conversion utility
5. ✅ Create dedicated results page following existing pattern
6. ✅ Add payment integration following paymentAPI pattern
7. ✅ Add to Header navigation and homepage carousel
8. ✅ Update profile page API calls (Promise.all pattern)
9. ✅ Add TypeScript interfaces for all data structures
10. ✅ Test cross-device continuation with progress manager
```

### **INTEGRATION_CHANGE_PROMPT**
```
When modifying integrations (payment, auth, external APIs):
1. ✅ Check impact on AuthContext and authentication flow
2. ✅ Verify all test types still work with integration change
3. ✅ Update error handling across all affected components
4. ✅ Test payment flow for all assessment types if payment-related
5. ✅ Verify Google Sign-In integration if auth-related
6. ✅ Check cross-device warnings if session-related
7. ✅ Update API client interceptors if authentication-related
8. ✅ Test profile page unified display if data structure changes
```

### **UI_COMPONENT_PROMPT**
```
When modifying shared UI components:
1. ✅ Identify all components using this shared component (Header, Footer, etc.)
2. ✅ Test impact on all assessment types and pages
3. ✅ Verify mobile/desktop responsive behavior
4. ✅ Check authentication state handling if auth-related component
5. ✅ Ensure consistency with design system (#2A3262, #ABD305, #DFE4FF)
6. ✅ Test with all user states (logged in, logged out, mid-test)
7. ✅ Verify accessibility with Radix UI patterns
8. ✅ Check cross-device behavior if progress-related
```

## AI_INSTRUCTIONS

**BEFORE_ANY_CHANGES:**
1. **IDENTIFY CHANGE TYPE** and use appropriate CHANGE-SPECIFIC PROMPT above
2. Check if similar functionality exists in ACTIVE_FEATURES
3. Verify SHARED_RESOURCES for reusable components/hooks
4. Follow established DEVELOPMENT_PATTERNS discovered in this project
5. **Consult API_DOCUMENTATION_RESOURCES** for latest API specs and formats
6. Consider impact on dependent features

**GENERAL_IMPLEMENTATION_RULES:**
- ALWAYS start with the relevant CHANGE-SPECIFIC PROMPT checklist
- Check SHARED_RESOURCES before creating new components
- VERIFY API formats against Postman collections in temporer folder
- REUSE existing patterns (authAPI, apiClient, progress managers)
- FOLLOW naming conventions (PascalCase components, camelCase APIs)
- CONSIDER feature relationships before making breaking changes
- UPDATE this context when adding major new features or assessment types

**COMMON_WORKFLOWS:**
- **New API Endpoint** → Use API_CHANGE_PROMPT
- **New Page/Feature** → Use FEATURE_ADDITION_PROMPT
- **New Test Type** → Use ASSESSMENT_TYPE_PROMPT
- **Auth/Payment Changes** → Use INTEGRATION_CHANGE_PROMPT
- **Shared Component Updates** → Use UI_COMPONENT_PROMPT

## QUICK_LOOKUP
**MOST_USED_COMPONENTS:** Header, Footer, Button, Card, AuthContext, CrossDeviceWarning
**MOST_USED_HOOKS:** useAuth(), useCallback, useEffect, useState
**MOST_USED_APIS:** authAPI, apiClient interceptors, test-specific APIs (varkAPI, aiKnowledgeAPI)
**API_REFERENCE:** `/temporer folder for claude/` - Postman collections & AI Knowledge API docs
**ACTIVE_FEATURE_COUNT:** 10 major features (5 assessment types + auth + payment + coupon system + profile + homepage)

---

**CONTEXT_VERSION:** 1.3 | **LAST_UPDATED:** 2025-09-29

Remember: This context exists to prevent code duplication and maintain consistency. Always start with the appropriate CHANGE-SPECIFIC PROMPT for your task type, then reference the relevant sections before suggesting new implementations.
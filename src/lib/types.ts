// User & Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  birthday?: string | null;
  avatar_url?: string | null;
  password_digest?: string; // Only in register response
  created_at?: string;
  updated_at: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  data: {
    user: User;
    token: string;
  };
  status: string;
  error: boolean;
}

// VARK Test Types
export interface VarkCategory {
  id: string;
  code: string;
  name: string;
}

export interface VarkQuestion {
  id: string;
  body: string;
  max_weight: number;
  category: VarkCategory;
}

export interface VarkQuestionSet {
  id: string;
  version: number;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  time_limit: number;
  questions: VarkQuestion[];
}

export interface VarkTest {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: 'in_progress' | 'completed';
  time_limit: number;
  expires_at: string;
  questions: VarkQuestion[];
}

export interface VarkAnswer {
  question_id: string;
  category_id: string;
  point: number;
}

export interface VarkSubmission {
  answers: VarkAnswer[];
}

// VARK Results Types (based on the new API response)
export interface VarkScoreBreakdown {
  category: string;
  code: string;
  score: number;
  percentage: number;
}

export interface VarkLearningStyleInterpretation {
  visual: string;
  aural: string;
  read_write: string;
  kinesthetic: string;
}

export interface VarkResultDescription {
  title: string;
  description: string;
  characteristics: string;
  study_recommendations: string;
  strengths: string;
  potential_challenges: string;
  career_suggestions: string;
  style_type: string;
  learning_styles: string[];
  multimodal: boolean;
}

export interface VarkTestResults {
  visual_score: number;
  aural_score: number;
  read_score: number;
  kinesthetic_score: number;
  min_score: number;
  max_score: number;
  total_score: number;
  scores_breakdown: VarkScoreBreakdown[];
  dominant_learning_styles: string[];
  learning_style_interpretation: VarkLearningStyleInterpretation;
  result_description: VarkResultDescription; // NEW FIELD ADDED
}

// Coupon Types
export interface Coupon {
  code: string;
  discount_type: 'percentage' | 'fixed';
  display_discount: string;
}

export interface CouponValidationRequest {
  coupon_code: string;
  amount: string;
}

export interface CouponPricing {
  original_amount: number;
  discount_amount: string;
  final_amount: string;
}

export interface CouponValidationResponse {
  valid: boolean;
  message: string;
  coupon: Coupon;
  pricing: CouponPricing;
}

// Payment Types
export interface PaymentOrder {
  id: string;
  order_number: string;
  amount: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  expires_at: string;
  created_at: string;
  description: string;
  test_type: string;
  testable: {
    id: string;
    type: string;
    status: string;
  };
  payment: Record<string, unknown> | null;
  can_download_certificate: boolean;
  // Enhanced fields for coupon support
  original_amount?: string;
  coupon_discount_amount?: string;
  coupon?: Coupon | null;
  pricing?: {
    final_amount: string;
    has_discount: boolean;
    discount_percentage: number;
  };
}

export interface PaymentToken {
  id: string;
  snap_token: string;
  order_id: string;
  midtrans_order_id: string;
  status: string;
  amount: string;
  paid_at: string | null;
  expires_at: string;
  midtrans_transaction_id: string | null;
  midtrans_response: string;
}

// API Response Types (Based on actual API responses)
export interface ApiResponse<T> {
  data: T;
  status: string;
  error: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

// AI Knowledge Test Types
export interface AiKnowledgeCategory {
  id: string;
  code: string; // PE, EE, SI, FC, HM, PV, HT, BI
  name: string;
}

export interface AiKnowledgeQuestion {
  id: string;
  body: string;
  max_weight: number;
  category: AiKnowledgeCategory;
}

export interface AiKnowledgeQuestionSet {
  id: string;
  version: number;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  time_limit: number;
  questions: AiKnowledgeQuestion[];
}

export interface AiKnowledgeTest {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: 'in_progress' | 'completed';
  time_limit: number;
  expires_at: string;
  questions: AiKnowledgeQuestion[];
}

export interface AiKnowledgeAnswer {
  question_id: string;
  category_id: string;
  point: number;
}

export interface AiKnowledgeSubmission {
  answers: AiKnowledgeAnswer[];
}

// AI Knowledge Results Types
export interface AiKnowledgeScoreBreakdown {
  category: string;
  code: string;
  score: number;
  percentage: number;
}

export interface AiKnowledgeTestResults {
  pe_score: number; // Performance Expectancy
  ee_score: number; // Effort Expectancy
  si_score: number; // Social Influence
  fc_score: number; // Facilitating Conditions
  hm_score: number; // Hedonic Motivation
  pv_score: number; // Price Value
  ht_score: number; // Habit
  bi_score: number; // Behavioral Intention
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

// Behavioral Test Types
export interface BehavioralCategory {
  id: string;
  code: string; // Behavioral dimension codes (will vary based on actual assessment)
  name: string;
}

export interface BehavioralQuestion {
  id: string;
  body: string;
  max_weight: number;
  category: BehavioralCategory;
}

export interface BehavioralQuestionSet {
  id: string;
  version: number;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  time_limit: number;
  questions: BehavioralQuestion[];
}

export interface BehavioralTest {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: 'in_progress' | 'completed';
  time_limit: number;
  expires_at: string;
  questions: BehavioralQuestion[];
}

export interface BehavioralAnswer {
  question_id: string;
  category_id: string;
  point: number;
}

export interface BehavioralSubmission {
  answers: BehavioralAnswer[];
}

// Behavioral Test Results Types
export interface BehavioralScoreBreakdown {
  category: string;
  code: string;
  score: number;
  percentage: number;
}

export interface BehavioralTestResults {
  h_score: number; // Habits (kebiasaan)
  m_score: number; // Motivation (motivasi)
  r_score: number; // Self-Regulation (regulasi diri)
  e_score: number; // Engagement (keterlibatan)
  average_score: number; // Computed average from the 4 dimensions
  level_label: string; // Category indicator (e.g., "High", "Medium", "Low")
  min_score: number;
  max_score: number;
  total_score: number;
  scores_breakdown: BehavioralScoreBreakdown[];
  dominant_dimensions: string[];
  dimension_interpretations: Record<string, string>;
  result_description: {
    title: string;
    description: string;
    recommendations: string;
    behavioral_profile: string;
  };
}

// Comprehensive Test Types (combines VARK + AI Knowledge + Behavioral)
export interface ComprehensiveCategory {
  id: string;
  code: string; // Can be VARK codes (V, A, R, K), AI codes (PE, EE, SI, etc.), or Behavioral codes
  name: string;
  type: 'vark' | 'ai_knowledge' | 'behavioral'; // Indicates which assessment this belongs to
}

export interface ComprehensiveQuestion {
  id: string;
  body: string;
  max_weight: number;
  category: ComprehensiveCategory;
}

export interface ComprehensiveQuestionSet {
  id: string;
  version: number;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  time_limit: number;
  questions: ComprehensiveQuestion[];
}

export interface ComprehensiveTest {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: 'in_progress' | 'completed';
  time_limit: number;
  expires_at: string;
  questions: ComprehensiveQuestion[];
}

export interface ComprehensiveAnswer {
  question_id: string;
  category_id: string;
  point: number;
}

export interface ComprehensiveSubmission {
  answers: ComprehensiveAnswer[];
}

// Comprehensive Test Results Types
export interface ComprehensiveScoreBreakdown {
  category: string;
  code: string;
  score?: number;
  average?: number; // API returns 'average' instead of 'score'
  percentage?: number;
  type?: 'vark' | 'ai_knowledge' | 'behavioral';
}

export interface ComprehensiveTestResults {
  id: string;
  total_score: number;
  total_questions: number;
  average_score: string; // API returns as string
  level_label: string; // Category indicator (e.g., "High", "Medium", "Low")
  level_message: string;
  created_at: string;
  category_scores: {
    cf: number; // Cognitive Flexibility (fleksibilitas kognitif)
    r: number; // Resilience (resiliensi)
    e: number; // Self-Esteem (harga diri)
    ag: number; // Academic Grit (keteguhan akademik)
    ma: number; // Metacognitive Awareness (kesadaran metakognitif)
  };
  category_breakdown: {
    CF: number;
    R: number;
    E: number;
    AG: number;
    MA: number;
  };
  strongest_categories: string[];
  weakest_categories: string[];
  detailed_analysis: {
    description: string; // HTML string
    study_recommendations: string; // HTML string
  };
  scores_breakdown?: ComprehensiveScoreBreakdown[]; // Optional for backward compatibility
  test_info: {
    id: string;
    completed_at: string;
    question_set: {
      id: string;
      name: string;
      version: number;
    };
  };
}

// Extend the existing User interface with Google fields (fixing duplicate definition)
declare module './types' {
  interface User {
    // NEW: Google-specific fields
    google_id?: string;
    google_email?: string;
    google_name?: string;
    google_picture?: string;
    auth_provider?: 'email' | 'google' | 'both'; // Indicates how user can authenticate
  }
}

// NEW: Google Authentication Response
export interface GoogleAuthResponse {
  data: {
    token: string;
    user: User;
  };
  status: string;
  error: boolean;
  message?: string; // For success messages like "Account linked successfully"
}

// NEW: Cross-Authentication Response (for enhanced email login)
export interface CrossAuthResponse {
  success: boolean;
  requiresGoogleAuth?: boolean;
  message?: string;
  error?: string;
  token?: string;
  user?: User;
}

// NEW: Google ID Token Payload (what we receive from Google)
export interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
}

// NEW: Google SDK Types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleInitConfig) => void;
          prompt: (callback?: (notification: PromptMomentNotification) => void) => void;
          renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
          disableAutoSelect: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

export interface GoogleInitConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

export interface GoogleButtonConfig {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
}

export interface PromptMomentNotification {
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
  isSkippedMoment: () => boolean;
  getSkippedReason: () => string;
  isDismissedMoment: () => boolean;
  getDismissedReason: () => string;
}

// TPA Test Types (Test of Potential Ability)
export interface TpaCategory {
  id: string;
  code: string; // AR (Analytical), QR (Quantitative), SR (Spatial), VR (Verbal)
  name: string;
}

export interface TpaQuestion {
  id: string;
  question_text: string;
  question_image_url?: string; // Visual element - key difference from other tests
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  category: string; // Reasoning category name
  difficulty_level: number;
}

export interface TpaQuestionSet {
  id: string;
  version: number;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  time_limit: number;
  total_questions: number;
  questions_by_category: {
    "Analytical Reasoning": number;
    "Quantitative Reasoning": number;
    "Spatial Reasoning": number;
    "Verbal Reasoning": number;
  };
  questions: TpaQuestion[];
}

export interface TpaTest {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: 'in_progress' | 'completed';
  time_limit: number;
  time_remaining: number;
  expires_at: string;
  question_set: {
    id: string;
    name: string;
    version: string;
    time_limit: number;
  };
  questions: TpaQuestion[];
  created_at: string;
}

export interface TpaAnswer {
  tpa_question_id: string;
  selected_option: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface TpaSubmission {
  answers: TpaAnswer[];
}

// TPA Test Results Types
export interface TpaScoreBreakdown {
  category: string;
  code: string;
  score: number;
  percentage: number;
}

export interface TpaTestResults {
  id: string;
  total_score: number;
  total_questions: number;
  average_score: string; // API returns as string
  level_label: string; // Category indicator (e.g., "Kategori Tinggi", "Kategori Rendah")
  level_message: string;
  category_scores: {
    verbal: number;
    quantitative: number;
    analytic: number; // Note: API uses "analytic" not "analytical"
    spatial: number;
  };
  category_breakdown: Record<string, number>; // Empty object in current API response
  strongest_categories: string[];
  weakest_categories: string[];
  detailed_analysis: {
    strengths: string[];
    areas_for_improvement: string[];
    overall_assessment: string;
    recommendations: string[];
  };
  scores_breakdown?: TpaScoreBreakdown[]; // Optional for backward compatibility
  test_info: {
    test_name: string;
    test_version: string;
    completion_date: string;
    time_taken: number;
  };
}

// TPA Test History (for profile integration)
export interface TpaTestHistory {
  id: string;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at: string | null;
  question_set: {
    id: string;
    name: string;
    version: number;
    time_limit: number;
  };
  results?: {
    total_score: number;
    dominant_reasoning_categories: string[];
  } | null;
  time_remaining: number;
  is_expired: boolean;
}
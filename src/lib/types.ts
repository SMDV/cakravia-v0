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

// Add these to your existing src/lib/types.ts file

// Extend your existing User interface with Google fields
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
  // NEW: Google-specific fields
  google_id?: string;
  google_email?: string;
  google_name?: string;
  google_picture?: string;
  auth_provider?: 'email' | 'google' | 'both'; // Indicates how user can authenticate
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
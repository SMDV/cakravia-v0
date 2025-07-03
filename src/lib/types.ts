// User & Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  birthday?: string;
  avatar?: string;
  created_at: string;
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

// API Response Types
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
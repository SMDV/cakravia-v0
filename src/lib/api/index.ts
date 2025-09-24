// Export all API services
export * from './client';
export * from './auth';
export * from './vark';
export * from './aiKnowledge';
export * from './behavioral';
export * from './comprehensive';
export * from './payment';

// Export types
export * from '../types';

// Re-export commonly used items for convenience
export { apiClient } from './client';
export { authAPI } from './auth';
export { varkAPI } from './vark';
export { aiKnowledgeAPI } from './aiKnowledge';
export { behavioralAPI } from './behavioral';
export { comprehensiveAPI } from './comprehensive';
export { paymentAPI } from './payment';
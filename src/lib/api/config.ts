import { apiClient } from './client';
import { ConfigResponse } from '../types';

export const configAPI = {
  /**
   * Get application configuration including pricing for all test types
   * This endpoint does not require authentication
   */
  getConfig: async (): Promise<ConfigResponse> => {
    const response = await apiClient.get<ConfigResponse>('/config');
    return response.data;
  },
};

export default configAPI;

/**
 * New API Client v2 - Migration wrapper
 * This file provides a compatibility layer for transitioning from the old API client
 * to the new modular architecture.
 */

import { apiClient as newApiClient } from './core';
import type { ApiClientOptions } from './client';

export const API_BASE_URL = newApiClient['baseURL'];

/**
 * Legacy API client function for backward compatibility
 * @deprecated Use the new apiClient from './core' instead
 */
export async function apiClient<T>({
  endpoint,
  method = 'GET',
  params = {},
  data,
  headers = {},
}: ApiClientOptions): Promise<T> {
  // The new client handles auth automatically via interceptors
  // based on the endpoint, so the requireAuth flag is ignored
  
  return newApiClient.request<T>({
    endpoint,
    method,
    params,
    data,
    headers,
  });
}

// Export the new client for gradual migration
export { newApiClient };
export { 
  ApiError, 
  NetworkError, 
  AuthenticationError, 
  ValidationError 
} from './core';
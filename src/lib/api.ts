import type { DatasetResponse } from '../../types/dataset';
import { getStoredTokens, isTokenExpired, refreshAccessToken, removeTokens } from './auth';
import { env } from '../config/env';

const API_BASE_URL = env.API_BASE_URL;

interface ApiOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string | number | boolean | undefined>;
  data?: unknown;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

// Global variable to track if a token refresh is in progress
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

// Function to get auth headers
async function getAuthHeaders(): Promise<Record<string, string>> {
  const tokens = getStoredTokens();
  
  if (!tokens) {
    throw new Error('Authentication required');
  }

  // Check if token is expired and needs refresh
  if (isTokenExpired(tokens.access_token)) {
    // Only allow one refresh at a time
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }
    
    // Wait for the ongoing refresh to complete
    if (refreshPromise) {
      await refreshPromise;
    }
    
    // Get the fresh tokens
    const freshTokens = getStoredTokens();
    if (!freshTokens) {
      throw new Error('Authentication required');
    }
    
    return { Authorization: `Bearer ${freshTokens.access_token}` };
  }
  
  return { Authorization: `Bearer ${tokens.access_token}` };
}

// Function to refresh token
async function refreshToken(): Promise<void> {
  try {
    const tokens = getStoredTokens();
    if (!tokens) {
      throw new Error('No refresh token available');
    }
    
    const newTokens = await refreshAccessToken(tokens.refresh_token);
    
    // Store the new tokens
    localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
  } catch (error) {
    // If refresh fails, clear tokens and force re-login
    removeTokens();
    console.error('Token refresh failed:', error);
    throw new Error('Session expired. Please login again.');
  }
}

export async function apiClient<T>({
  endpoint,
  method = 'GET',
  params = {},
  data,
  headers = {},
  requireAuth = true,
}: ApiOptions): Promise<T> {
  try {
    // Build URL with params
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });

    // Configure request options
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      },
    };

    // Add auth headers if required
    if (requireAuth) {
      try {
        const authHeaders = await getAuthHeaders();
        options.headers = { ...options.headers, ...authHeaders };
      } catch (error) {
        // If it's an auth error during a request that requires auth,
        // we should redirect to login
        const authError = error as Error;
        console.error('Authentication error:', authError.message);
        
        // Use the window location to redirect to login
        // This will work in the browser but is a side effect
        window.location.href = '/login';
        throw authError;
      }
    }

    // Add request body for non-GET requests
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    // Make the request
    const response = await fetch(url.toString(), options);

    // Handle non-2xx responses
    if (!response.ok) {
      // Handle 401 Unauthorized - token might have expired during the request
      if (response.status === 401 && requireAuth) {
        // Force logout if refresh token also failed
        removeTokens();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `API error: ${response.status} ${response.statusText}`
      );
    }

    // Parse response
    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Auth API endpoints
export const authApi = {
  validateSession: () => 
    apiClient<{ valid: boolean }>({
      endpoint: '/users/me',
      requireAuth: true,
    }),
};

// Dataset API endpoints
export const datasetsApi = {
  getDatasets: (params?: { limit?: number; offset?: number }) => 
    apiClient<DatasetResponse[]>({
      endpoint: '/datasets',
      params,
      requireAuth: true,
    }),
  
  getDatasetById: (id: number) => 
    apiClient<DatasetResponse>({
      endpoint: `/datasets/${id}`,
      requireAuth: true,
    }),
    
  // Get versions for a dataset
  getDatasetVersions: (datasetId: number) => 
    apiClient<any[]>({
      endpoint: `/datasets/${datasetId}/versions`,
      requireAuth: true,
    }),
    
  // Get data from a specific dataset version
  getDatasetVersionData: (datasetId: number, versionId: number, params?: { 
    limit?: number,
    offset?: number 
  }) => 
    apiClient<any>({
      endpoint: `/datasets/${datasetId}/versions/${versionId}/data`,
      params,
      requireAuth: true,
    }),
    
  // Generate dataset exploration with pandas profiling
  exploreDataset: (datasetId: number, versionId: number, options: { 
    format: string, 
    run_profiling: boolean 
  }) => 
    apiClient<any>({
      endpoint: `/explore/${datasetId}/${versionId}`,
      method: 'POST',
      data: options,
      requireAuth: true,
    }),
};
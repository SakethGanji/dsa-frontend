import { getStoredTokens, isTokenExpired, refreshAccessToken, removeTokens } from '../auth';

export const API_BASE_URL = 'http://localhost:8000/api';

export interface ApiClientOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, string | number | boolean | undefined | string[]>;
  data?: unknown;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

// Track token refresh state
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

// Get auth headers with automatic token refresh
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

// Refresh access token
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

// Process URL params including arrays
function processParams(params: Record<string, any> = {}): URLSearchParams {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    
    if (Array.isArray(value)) {
      // Handle array params
      value.forEach((item) => {
        searchParams.append(key, String(item));
      });
    } else {
      // Handle regular params
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams;
}

// Main API client function
export async function apiClient<T>({
  endpoint,
  method = 'GET',
  params = {},
  data,
  headers = {},
  requireAuth = true,
}: ApiClientOptions): Promise<T> {
  try {
    // Build URL with params
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    // Process and add query parameters
    const searchParams = processParams(params);
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    // Configure request options
    const options: RequestInit = {
      method,
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
    };

    // Set content type for JSON requests with data
    if (data && method !== 'GET' && !headers['Content-Type']) {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json',
      };
    }

    // Add auth headers if required
    if (requireAuth) {
      try {
        const authHeaders = await getAuthHeaders();
        options.headers = { ...options.headers, ...authHeaders };
      } catch (error) {
        // Handle auth errors
        const authError = error as Error;
        console.error('Authentication error:', authError.message);
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw authError;
      }
    }

    // Add request body for non-GET requests
    if (data && method !== 'GET') {
      // Handle FormData separately
      if (data instanceof FormData) {
        // FormData has its own content type header
        delete (options.headers as any)['Content-Type'];
        options.body = data;
      } else {
        options.body = JSON.stringify(data);
      }
    }

    // Make the request
    const response = await fetch(url.toString(), options);

    // Handle non-2xx responses
    if (!response.ok) {
      // Handle 401 Unauthorized - token might have expired during the request
      if (response.status === 401 && requireAuth) {
        // Force logout if refresh token also failed
        removeTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please login again.');
      }
      
      // Try to parse error response as JSON
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `API error: ${response.status} ${response.statusText}`
      );
    }

    // Special case for binary downloads or empty responses
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/octet-stream')) {
      return response.blob() as unknown as T;
    }
    
    if (response.headers.get('content-length') === '0') {
      return {} as T;
    }
    
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as unknown as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
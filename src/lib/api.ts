import type {DatasetResponse} from '../../types/dataset';

const API_BASE_URL = 'http://localhost:8000/api';

interface ApiOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string | number | boolean | undefined>;
  data?: unknown;
  headers?: Record<string, string>;
}

export async function apiClient<T>({
  endpoint,
  method = 'GET',
  params = {},
  data,
  headers = {},
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

    console.log(`Fetching from API: ${url.toString()}`);

    // Configure request options
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      },
    };

    // Add request body for non-GET requests
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    // Make the request
    const response = await fetch(url.toString(), options);

    // Handle non-2xx responses
    if (!response.ok) {
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

// Dataset API endpoints
export const datasetsApi = {
  getDatasets: (params?: { limit?: number; offset?: number }) => 
    apiClient<DatasetResponse[]>({
      endpoint: '/datasets',
      params,
    }),
  
  getDatasetById: (id: number) => 
    apiClient<DatasetResponse>({
      endpoint: `/datasets/${id}`,
    }),
};
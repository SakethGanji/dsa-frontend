import { env } from '../../../config/env';
import { ApiError, NetworkError } from './errors';
import { 
  InterceptorManager, 
  defaultRequestInterceptors, 
  defaultResponseInterceptors 
} from './interceptors';

export interface ApiClientConfig {
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}

export interface RequestOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, string | number | boolean | undefined | string[]>;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private interceptors: InterceptorManager;

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || env.API_BASE_URL;
    this.defaultHeaders = {
      'Accept': 'application/json',
      ...config.defaultHeaders,
    };
    this.timeout = config.timeout || 30000; // 30 seconds
    this.interceptors = new InterceptorManager();

    // Add default interceptors
    defaultRequestInterceptors.forEach(interceptor => 
      this.interceptors.addRequestInterceptor(interceptor)
    );
    defaultResponseInterceptors.forEach(interceptor => 
      this.interceptors.addResponseInterceptor(interceptor)
    );
  }

  private processParams(params: Record<string, any> = {}): URLSearchParams {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      
      if (Array.isArray(value)) {
        value.forEach((item) => {
          searchParams.append(key, String(item));
        });
      } else {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams;
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    if (contentType?.includes('application/octet-stream')) {
      return response.blob() as unknown as T;
    }
    
    if (contentLength === '0' || response.status === 204) {
      return {} as T;
    }
    
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as unknown as T;
  }

  async request<T = unknown>({
    endpoint,
    method = 'GET',
    params = {},
    data,
    headers = {},
    signal,
  }: RequestOptions): Promise<T> {
    try {
      const url = new URL(`${this.baseURL}${endpoint}`);
      
      const searchParams = this.processParams(params);
      searchParams.forEach((value, key) => {
        url.searchParams.append(key, value);
      });

      let requestConfig: RequestInit = {
        method,
        headers: {
          ...this.defaultHeaders,
          ...headers,
        },
        signal: signal || AbortSignal.timeout(this.timeout),
      };

      if (data && method !== 'GET') {
        if (data instanceof FormData) {
          delete (requestConfig.headers as any)['Content-Type'];
          requestConfig.body = data;
        } else {
          requestConfig.headers = {
            ...requestConfig.headers,
            'Content-Type': 'application/json',
          };
          requestConfig.body = JSON.stringify(data);
        }
      }

      // Apply request interceptors
      requestConfig = await this.interceptors.applyRequestInterceptors(
        requestConfig, 
        url.toString()
      );

      const response = await fetch(url.toString(), requestConfig);

      // Apply response interceptors
      const processedResponse = await this.interceptors.applyResponseInterceptors(response);

      return this.parseResponse<T>(processedResponse);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network request failed');
      }
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timeout', undefined, 'TIMEOUT_ERROR');
      }
      
      throw error;
    }
  }

  // Convenience methods
  get<T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'endpoint' | 'method'>): Promise<T> {
    return this.request<T>({ endpoint, method: 'GET', ...options });
  }

  post<T = unknown>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'endpoint' | 'method' | 'data'>): Promise<T> {
    return this.request<T>({ endpoint, method: 'POST', data, ...options });
  }

  put<T = unknown>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'endpoint' | 'method' | 'data'>): Promise<T> {
    return this.request<T>({ endpoint, method: 'PUT', data, ...options });
  }

  patch<T = unknown>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'endpoint' | 'method' | 'data'>): Promise<T> {
    return this.request<T>({ endpoint, method: 'PATCH', data, ...options });
  }

  delete<T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'endpoint' | 'method'>): Promise<T> {
    return this.request<T>({ endpoint, method: 'DELETE', ...options });
  }

  // Add custom interceptors
  addRequestInterceptor(interceptor: any) {
    return this.interceptors.addRequestInterceptor(interceptor);
  }
  
  addResponseInterceptor(interceptor: any) {
    return this.interceptors.addResponseInterceptor(interceptor);
  }
}

// Export default instance
export const apiClient = new ApiClient();
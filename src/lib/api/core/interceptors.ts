import { ApiError, AuthenticationError } from './errors';
import { tokenManager } from './tokenManager';

export interface RequestInterceptor {
  onRequest?: (config: RequestInit, url: string) => Promise<RequestInit> | RequestInit;
  onRequestError?: (error: Error) => Promise<never> | never;
}

export interface ResponseInterceptor {
  onResponse?: (response: Response) => Promise<Response> | Response;
  onResponseError?: (error: Error) => Promise<never> | never;
}

export class InterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index !== -1) {
        this.requestInterceptors.splice(index, 1);
      }
    };
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index !== -1) {
        this.responseInterceptors.splice(index, 1);
      }
    };
  }

  async applyRequestInterceptors(config: RequestInit, url: string): Promise<RequestInit> {
    let modifiedConfig = config;
    
    for (const interceptor of this.requestInterceptors) {
      try {
        if (interceptor.onRequest) {
          modifiedConfig = await interceptor.onRequest(modifiedConfig, url);
        }
      } catch (error) {
        if (interceptor.onRequestError) {
          await interceptor.onRequestError(error as Error);
        } else {
          throw error;
        }
      }
    }
    
    return modifiedConfig;
  }

  async applyResponseInterceptors(response: Response): Promise<Response> {
    let modifiedResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      try {
        if (interceptor.onResponse) {
          modifiedResponse = await interceptor.onResponse(modifiedResponse);
        }
      } catch (error) {
        if (interceptor.onResponseError) {
          await interceptor.onResponseError(error as Error);
        } else {
          throw error;
        }
      }
    }
    
    return modifiedResponse;
  }
}

export const defaultRequestInterceptors: RequestInterceptor[] = [
  {
    onRequest: async (config, url) => {
      const requiresAuth = !url.includes('/users/token') && !url.includes('/users/register');
      
      if (requiresAuth) {
        try {
          const authHeaders = await tokenManager.getAuthHeaders();
          config.headers = {
            ...config.headers,
            ...authHeaders,
          };
        } catch (error) {
          throw new AuthenticationError((error as Error).message);
        }
      }
      
      return config;
    },
  },
];

export const defaultResponseInterceptors: ResponseInterceptor[] = [
  {
    onResponse: async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          tokenManager.clearTokens();
          throw new AuthenticationError(errorData.detail || 'Session expired');
        }
        
        throw ApiError.fromResponse(response, errorData);
      }
      
      return response;
    },
  },
];
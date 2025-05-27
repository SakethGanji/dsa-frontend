import { apiClient } from './client';
import type { 
  Token, LoginRequest, UserOut, UserCreate, 
  Dataset, DatasetListParams, DatasetUpdate, DatasetUploadParams,
  DatasetUploadResponse, DatasetVersion, Tag, SheetDataParams,
  ExploreRequest, SamplingRequest, SamplingResult
} from './types';

// Re-export client
export { apiClient, API_BASE_URL } from './client';

// Define API endpoints by category
export const api = {
  // Auth endpoints
  auth: {
    login: (data: LoginRequest) => 
      apiClient<Token>({
        endpoint: '/users/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        // Convert to URLSearchParams
        data: new URLSearchParams({
          grant_type: data.grant_type || 'password',
          username: data.username,
          password: data.password,
          scope: data.scope || '',
          client_id: data.client_id || '',
          client_secret: data.client_secret || '',
        }),
        requireAuth: false,
      }),
    
    refreshToken: (refreshToken: string) =>
      apiClient<Token>({
        endpoint: '/users/token/refresh',
        method: 'POST',
        params: { refresh_token: refreshToken },
        requireAuth: false,
      }),

    validateSession: () => 
      apiClient<UserOut>({
        endpoint: '/users/me',
        requireAuth: true,
      }),
  },

  // User endpoints
  users: {
    register: (userData: UserCreate) =>
      apiClient<UserOut>({
        endpoint: '/users/register',
        method: 'POST',
        data: userData,
        requireAuth: false,
      }),
    
    getAll: () =>
      apiClient<UserOut[]>({
        endpoint: '/users/',
        requireAuth: true,
      }),
    
    create: (userData: UserCreate) =>
      apiClient<UserOut>({
        endpoint: '/users/',
        method: 'POST',
        data: userData,
        requireAuth: true,
      }),
  },

  // Dataset endpoints
  datasets: {
    getAll: (params?: DatasetListParams) =>
      apiClient<Dataset[]>({
        endpoint: '/datasets',
        params,
        requireAuth: true,
      }),
    
    getById: (id: number) =>
      apiClient<Dataset>({
        endpoint: `/datasets/${id}`,
        requireAuth: true,
      }),
    
    update: (id: number, data: DatasetUpdate) =>
      apiClient<Dataset>({
        endpoint: `/datasets/${id}`,
        method: 'PATCH',
        data,
        requireAuth: true,
      }),
    
    upload: (data: DatasetUploadParams) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('name', data.name);
      
      if (data.dataset_id !== undefined) {
        formData.append('dataset_id', String(data.dataset_id));
      }
      
      if (data.description) {
        formData.append('description', data.description);
      }
      
      if (data.tags) {
        formData.append('tags', data.tags);
      }
      
      return apiClient<DatasetUploadResponse>({
        endpoint: '/datasets/upload',
        method: 'POST',
        data: formData,
        requireAuth: true,
      });
    },
    
    getAllTags: () =>
      apiClient<Tag[]>({
        endpoint: '/datasets/tags',
        requireAuth: true,
      }),
    
    // Dataset versions
    versions: {
      getAll: (datasetId: number) =>
        apiClient<DatasetVersion[]>({
          endpoint: `/datasets/${datasetId}/versions`,
          requireAuth: true,
        }),
      
      getOne: (datasetId: number, versionId: number) =>
        apiClient<DatasetVersion>({
          endpoint: `/datasets/${datasetId}/versions/${versionId}`,
          requireAuth: true,
        }),
      
      delete: (datasetId: number, versionId: number) =>
        apiClient<void>({
          endpoint: `/datasets/${datasetId}/versions/${versionId}`,
          method: 'DELETE',
          requireAuth: true,
        }),
      
      download: (datasetId: number, versionId: number) =>
        apiClient<Blob>({
          endpoint: `/datasets/${datasetId}/versions/${versionId}/download`,
          requireAuth: true,
        }),
      
      listSheets: (datasetId: number, versionId: number) =>
        apiClient<{ name: string, sheet_index: number, id: number }[]>({
          endpoint: `/datasets/${datasetId}/versions/${versionId}/sheets`,
          requireAuth: true,
        }),
      
      getData: (datasetId: number, versionId: number, params?: SheetDataParams) =>
        apiClient<{ columns: string[], data: any[][] }>({
          endpoint: `/datasets/${datasetId}/versions/${versionId}/data`,
          params,
          requireAuth: true,
        }),
    },
  },

  // Data exploration endpoints
  explore: {
    runExplore: (datasetId: number, versionId: number, options: ExploreRequest) =>
      apiClient<any>({
        endpoint: `/explore/${datasetId}/${versionId}`,
        method: 'POST',
        data: options,
        requireAuth: true,
      }),
  },
  
  // Sampling endpoints
  sampling: {
    execute: (datasetId: number, versionId: number, request: SamplingRequest) =>
      apiClient<SamplingResult[]>({
        endpoint: `/sampling/${datasetId}/${versionId}/execute`,
        method: 'POST',
        data: request,
        requireAuth: true,
      }),
  },
};
import { apiClient } from './core';
import type { 
  Token, LoginRequest, UserOut, UserCreate, 
  Dataset, DatasetListParams, DatasetUpdate, DatasetUploadParams,
  DatasetUploadResponse, DatasetVersion, Tag, SheetDataParams,
  ExploreRequest, SamplingRequest, SamplingResult,
  MultiRoundSamplingRequest, MultiRoundSamplingResponse
} from './types';

// Re-export client and API base URL
export { apiClient } from './core';
export const API_BASE_URL = apiClient.getBaseURL;

// Define API endpoints by category
export const api = {
  // Auth endpoints
  auth: {
    login: (data: LoginRequest) => 
      apiClient.post<Token>('/users/token', new URLSearchParams({
        grant_type: data.grant_type || 'password',
        username: data.username,
        password: data.password,
        scope: data.scope || '',
        client_id: data.client_id || '',
        client_secret: data.client_secret || '',
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    
    refreshToken: (refreshToken: string) =>
      apiClient.post<Token>('/users/token/refresh', undefined, {
        params: { refresh_token: refreshToken },
      }),

    validateSession: () => 
      apiClient.get<UserOut>('/users/me'),
  },

  // User endpoints
  users: {
    register: (userData: UserCreate) =>
      apiClient.post<UserOut>('/users/register', userData),
    
    getAll: () =>
      apiClient.get<UserOut[]>('/users/'),
    
    create: (userData: UserCreate) =>
      apiClient.post<UserOut>('/users/', userData),
  },

  // Dataset endpoints
  datasets: {
    getAll: (params?: DatasetListParams) =>
      apiClient.get<Dataset[]>('/datasets', { params }),
    
    getById: (id: number) =>
      apiClient.get<Dataset>(`/datasets/${id}`),
    
    update: (id: number, data: DatasetUpdate) =>
      apiClient.patch<Dataset>(`/datasets/${id}`, data),
    
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
      
      return apiClient.post<DatasetUploadResponse>('/datasets/upload', formData);
    },
    
    getAllTags: () =>
      apiClient.get<Tag[]>('/datasets/tags'),
    
    // Dataset versions
    versions: {
      getAll: (datasetId: number) =>
        apiClient.get<DatasetVersion[]>(`/datasets/${datasetId}/versions`),
      
      getOne: (datasetId: number, versionId: number) =>
        apiClient.get<DatasetVersion>(`/datasets/${datasetId}/versions/${versionId}`),
      
      delete: (datasetId: number, versionId: number) =>
        apiClient.delete<void>(`/datasets/${datasetId}/versions/${versionId}`),
      
      download: (datasetId: number, versionId: number) =>
        apiClient.get<Blob>(`/datasets/${datasetId}/versions/${versionId}/download`),
      
      listSheets: (datasetId: number, versionId: number) =>
        apiClient.get<{ name: string, sheet_index: number, id: number }[]>(`/datasets/${datasetId}/versions/${versionId}/sheets`),
      
      getData: (datasetId: number, versionId: number, params?: SheetDataParams) =>
        apiClient.get<{ columns: string[], data: any[][] }>(`/datasets/${datasetId}/versions/${versionId}/data`, { params }),
    },
  },

  // Data exploration endpoints
  explore: {
    runExplore: (datasetId: number, versionId: number, options: ExploreRequest) =>
      apiClient.post<any>(`/explore/${datasetId}/${versionId}`, options),
  },
  
  // Sampling endpoints
  sampling: {
    execute: async (datasetId: number, versionId: number, request: SamplingRequest, page?: number, pageSize?: number) => {
      const response = await apiClient.post<SamplingResult[] | { data: SamplingResult[], pagination?: any }>(
        `/sampling/${datasetId}/${versionId}/execute`, 
        request, 
        {
          params: {
            ...(page !== undefined && { page }),
            ...(pageSize !== undefined && { page_size: pageSize })
          }
        }
      );
      
      // Handle both array response and paginated response
      if (Array.isArray(response)) {
        return response;
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    },
    
    getColumns: (datasetId: number, versionId: number) =>
      apiClient.get<{
        columns: string[],
        column_types: Record<string, string>,
        total_rows: number,
        null_counts: Record<string, number>,
        sample_values: Record<string, any[]>
      }>(`/sampling/${datasetId}/${versionId}/columns`),
    
    executeMultiRound: (datasetId: number, versionId: number, request: MultiRoundSamplingRequest, page?: number, pageSize?: number) =>
      apiClient.post<MultiRoundSamplingResponse>(
        `/sampling/${datasetId}/${versionId}/multi-round/execute`,
        request,
        {
          params: {
            ...(page !== undefined && { page }),
            ...(pageSize !== undefined && { page_size: pageSize })
          }
        }
      ),
  },
};
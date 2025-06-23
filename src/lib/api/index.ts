import { apiClient } from './core';
import type { 
  Token, LoginRequest, UserOut, UserCreate, 
  Dataset, DatasetListParams, DatasetUpdate, DatasetUploadParams,
  DatasetUploadResponse, DatasetVersion, Tag, SheetDataParams,
  ExploreRequest, SamplingRequest, SamplingResult,
  MultiRoundSamplingRequest, MultiRoundSamplingResponse,
  StartJobResponse, JobStatusResponse, MergedSampleResponse,
  MergedSampleExportResponse, SearchRequest, SearchResponse,
  SuggestRequest, SuggestResponse
} from './types';

// Re-export client and API base URL
export { apiClient } from './core';
export const API_BASE_URL = apiClient.getBaseURL;

// Re-export types
export type { 
  Dataset, DatasetListParams, DatasetUpdate, DatasetUploadParams,
  DatasetUploadResponse, DatasetVersion, Tag, SheetDataParams,
  ExploreRequest, SamplingRequest, SamplingResult,
  MultiRoundSamplingRequest, MultiRoundSamplingResponse,
  StartJobResponse, JobStatusResponse, MergedSampleResponse,
  MergedSampleExportResponse, SearchRequest, SearchResponse,
  SuggestRequest, SuggestResponse, SearchResult
} from './types';


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
    
    // Search endpoints
    search: (params?: SearchRequest) => {
      const queryParams = new URLSearchParams();
      
      if (params) {
        // Add all parameters
        if (params.query) queryParams.append('query', params.query);
        if (params.fuzzy) queryParams.append('fuzzy', 'true');
        params.tags?.forEach(tag => queryParams.append('tags', tag));
        params.file_types?.forEach(type => queryParams.append('file_types', type));
        params.created_by?.forEach(id => queryParams.append('created_by', id.toString()));
        if (params.created_after) queryParams.append('created_after', params.created_after);
        if (params.created_before) queryParams.append('created_before', params.created_before);
        if (params.updated_after) queryParams.append('updated_after', params.updated_after);
        if (params.updated_before) queryParams.append('updated_before', params.updated_before);
        if (params.size_min) queryParams.append('size_min', params.size_min.toString());
        if (params.size_max) queryParams.append('size_max', params.size_max.toString());
        if (params.versions_min) queryParams.append('versions_min', params.versions_min.toString());
        if (params.versions_max) queryParams.append('versions_max', params.versions_max.toString());
        if (params.search_description !== undefined) queryParams.append('search_description', params.search_description.toString());
        if (params.search_tags !== undefined) queryParams.append('search_tags', params.search_tags.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.offset) queryParams.append('offset', params.offset.toString());
        if (params.sort_by) queryParams.append('sort_by', params.sort_by);
        if (params.sort_order) queryParams.append('sort_order', params.sort_order);
        if (params.include_facets !== undefined) queryParams.append('include_facets', params.include_facets.toString());
        params.facet_fields?.forEach(field => queryParams.append('facet_fields', field));
      }
      
      return apiClient.get<SearchResponse>(`/datasets/search?${queryParams.toString()}`);
    },
    
    suggest: (params: SuggestRequest) => {
      const queryParams = new URLSearchParams();
      queryParams.append('query', params.query);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      params.types?.forEach(type => queryParams.append('types', type));
      
      return apiClient.get<SuggestResponse>(`/datasets/search/suggest?${queryParams.toString()}`);
    },
    
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
    
    // New async multi-round sampling endpoints
    startMultiRoundJob: (datasetId: number, versionId: number, request: MultiRoundSamplingRequest) =>
      apiClient.post<StartJobResponse>(
        `/sampling/${datasetId}/${versionId}/multi-round/run`,
        request
      ),
    
    getJobStatus: (jobId: string) =>
      apiClient.get<JobStatusResponse>(`/sampling/multi-round/jobs/${jobId}`),
    
    getMergedSample: (jobId: string, params?: { 
      page?: number; 
      page_size?: number; 
      columns?: string[]; 
      export_format?: 'csv' | 'json' 
    }) => {
      const queryParams: Record<string, any> = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.page_size !== undefined) queryParams.page_size = params.page_size;
      if (params?.export_format) queryParams.export_format = params.export_format;
      if (params?.columns) {
        // Handle array of columns as multiple query params
        const searchParams = new URLSearchParams();
        if (params.page !== undefined) searchParams.append('page', String(params.page));
        if (params.page_size !== undefined) searchParams.append('page_size', String(params.page_size));
        if (params.export_format) searchParams.append('export_format', params.export_format);
        params.columns.forEach(col => searchParams.append('columns', col));
        
        return apiClient.get<MergedSampleResponse | MergedSampleExportResponse>(
          `/sampling/multi-round/jobs/${jobId}/merged-sample?${searchParams.toString()}`
        );
      }
      
      return apiClient.get<MergedSampleResponse | MergedSampleExportResponse>(
        `/sampling/multi-round/jobs/${jobId}/merged-sample`,
        { params: queryParams }
      );
    },
  },
};

// Export datasetsApi for backward compatibility
export const datasetsApi = api.datasets;
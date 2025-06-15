/**
 * Refactored datasets hooks using new patterns
 * This demonstrates how to use the new centralized query management
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  queryKeys, 
  useBaseQuery, 
  useBaseMutation, 
  usePaginatedQuery,
  type QueryConfig,
  type MutationConfig,
} from '@/lib/query';
import { apiClient, ApiError } from '@/lib/api/core';
import type {
  Dataset,
  DatasetListParams,
  DatasetUploadParams,
  DatasetVersion,
  SheetDataParams,
  DatasetUpdate,
  DatasetUploadResponse,
  Tag,
  PaginatedResponse,
} from '@/lib/api/types';
import { mapApiResponseToDatasetInfo } from '../../types/dataset';
import type { DatasetInfo } from '../../types/dataset';

// API functions using new client
const datasetsApi = {
  getAll: (params?: DatasetListParams) => 
    apiClient.get<Dataset[]>('/datasets', { params }),
  
  getPaginated: (params?: DatasetListParams) =>
    apiClient.get<PaginatedResponse<Dataset>>('/datasets/paginated', { params }),
  
  getById: (id: number) => 
    apiClient.get<Dataset>(`/datasets/${id}`),
  
  create: (data: DatasetUploadParams) => 
    apiClient.post<DatasetUploadResponse>('/datasets', data),
  
  update: (id: number, data: DatasetUpdate) => 
    apiClient.patch<Dataset>(`/datasets/${id}`, data),
  
  delete: (id: number) => 
    apiClient.delete(`/datasets/${id}`),
  
  getVersions: (datasetId: number) => 
    apiClient.get<DatasetVersion[]>(`/datasets/${datasetId}/versions`),
  
  getSheets: (datasetId: number, versionId: number) => 
    apiClient.get<string[]>(`/datasets/${datasetId}/versions/${versionId}/sheets`),
  
  getSheetData: (datasetId: number, versionId: number, params?: SheetDataParams) => 
    apiClient.get(`/datasets/${datasetId}/versions/${versionId}/data`, { params }),
  
  getTags: () => 
    apiClient.get<Tag[]>('/datasets/tags'),
};

// Refactored hooks using new patterns

export function useDatasets<TData = Dataset[]>(
  params: DatasetListParams = {},
  config?: QueryConfig<Dataset[], ApiError>
) {
  return useBaseQuery({
    queryKey: queryKeys.datasets.list(params),
    queryFn: () => datasetsApi.getAll(params),
    config,
  });
}

export function usePaginatedDatasets(
  initialPage = 1,
  initialPageSize = 10,
  filters: Omit<DatasetListParams, 'page' | 'pageSize'> = {}
) {
  return usePaginatedQuery({
    queryKey: (params) => queryKeys.datasets.list({ ...filters, ...params }),
    queryFn: (params) => datasetsApi.getPaginated({ ...filters, ...params }),
    initialPage,
    initialPageSize,
  });
}

export function useDataset(
  id: number | undefined,
  config?: QueryConfig<Dataset, ApiError>
) {
  return useBaseQuery({
    queryKey: queryKeys.datasets.detail(id!),
    queryFn: () => datasetsApi.getById(id!),
    config: {
      ...config,
      enabled: id !== undefined && (config?.enabled ?? true),
    },
  });
}

export function useDatasetInfo(
  id: number | undefined,
  config?: QueryConfig<Dataset, ApiError>
) {
  return useBaseQuery({
    queryKey: queryKeys.datasets.detail(id!),
    queryFn: () => datasetsApi.getById(id!),
    select: (data) => mapApiResponseToDatasetInfo(data),
    config: {
      ...config,
      enabled: id !== undefined && (config?.enabled ?? true),
    },
  });
}

export function useCreateDataset(
  config?: MutationConfig<DatasetUploadResponse, ApiError, DatasetUploadParams>
) {
  return useBaseMutation({
    mutationFn: datasetsApi.create,
    invalidateQueries: [queryKeys.datasets.all],
    config,
  });
}

export function useUpdateDataset(
  config?: MutationConfig<Dataset, ApiError, { id: number; data: DatasetUpdate }>
) {
  const queryClient = useQueryClient();

  return useBaseMutation({
    mutationFn: ({ id, data }) => datasetsApi.update(id, data),
    config: {
      ...config,
      onSuccess: (dataset, variables, context) => {
        // Optimistically update the cache
        queryClient.setQueryData(
          queryKeys.datasets.detail(variables.id),
          dataset
        );
        config?.onSuccess?.(dataset, variables, context);
      },
    },
    invalidateQueries: [
      queryKeys.datasets.lists(),
      queryKeys.datasets.detail(0), // Will be replaced with actual ID
    ],
  });
}

export function useDeleteDataset(
  config?: MutationConfig<void, ApiError, number>
) {
  return useBaseMutation({
    mutationFn: datasetsApi.delete,
    invalidateQueries: [queryKeys.datasets.all],
    config,
  });
}

export function useDatasetVersions(
  datasetId: number | undefined,
  config?: QueryConfig<DatasetVersion[], ApiError>
) {
  return useBaseQuery({
    queryKey: queryKeys.datasets.versions(datasetId!),
    queryFn: () => datasetsApi.getVersions(datasetId!),
    config: {
      ...config,
      enabled: datasetId !== undefined && (config?.enabled ?? true),
    },
  });
}

export function useDatasetSheets(
  datasetId: number | undefined,
  versionId: number | undefined,
  config?: QueryConfig<string[], ApiError>
) {
  return useBaseQuery({
    queryKey: queryKeys.datasets.sheets(datasetId!, versionId!),
    queryFn: () => datasetsApi.getSheets(datasetId!, versionId!),
    config: {
      ...config,
      enabled: datasetId !== undefined && versionId !== undefined && (config?.enabled ?? true),
    },
  });
}

export function useDatasetSheetData(
  datasetId: number | undefined,
  versionId: number | undefined,
  params?: SheetDataParams,
  config?: QueryConfig<any, ApiError>
) {
  return useBaseQuery({
    queryKey: queryKeys.datasets.sheetData(datasetId!, versionId!, params),
    queryFn: () => datasetsApi.getSheetData(datasetId!, versionId!, params),
    config: {
      ...config,
      enabled: datasetId !== undefined && versionId !== undefined && (config?.enabled ?? true),
    },
  });
}

export function useDatasetTags(
  config?: QueryConfig<Tag[], ApiError>
) {
  return useBaseQuery({
    queryKey: queryKeys.datasets.tags(),
    queryFn: datasetsApi.getTags,
    config,
  });
}

// Helper hook for prefetching
export function usePrefetchDataset() {
  const queryClient = useQueryClient();

  return useCallback((id: number) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.datasets.detail(id),
      queryFn: () => datasetsApi.getById(id),
    });
  }, [queryClient]);
}
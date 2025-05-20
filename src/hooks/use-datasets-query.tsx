import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  type UseQueryOptions, // Use type-only import
  type UseMutationOptions, // Use type-only import
  type UseQueryResult // Use type-only import
} from '@tanstack/react-query';
import { useState } from 'react';
import {
  api,
  type Dataset,
  type DatasetListParams,
  type DatasetUploadParams,
  type DatasetVersion,
  type SheetDataParams
} from '@/lib/api/index';
import type {
  DatasetUpdate,
  DatasetUploadResponse,
  Tag,
  PaginatedResponse
} from '@/lib/api/types';
import { mapApiResponseToDatasetInfo } from '../../types/dataset';
import type { DatasetInfo } from '../../types/dataset';

// Query keys for datasets
export const datasetKeys = {
  all: ['datasets'] as const,
  lists: () => [...datasetKeys.all, 'list'] as const,
  list: (filters: DatasetListParams = {}) => [...datasetKeys.lists(), filters] as const,
  details: () => [...datasetKeys.all, 'detail'] as const,
  detail: (id: number) => [...datasetKeys.details(), id] as const,
  versions: (datasetId: number) => [...datasetKeys.detail(datasetId), 'versions'] as const,
  version: (datasetId: number, versionId: number) => [...datasetKeys.versions(datasetId), versionId] as const,
  sheets: (datasetId: number, versionId: number) => [...datasetKeys.version(datasetId, versionId), 'sheets'] as const,
  sheetData: (datasetId: number, versionId: number, params?: SheetDataParams) => 
    [...datasetKeys.version(datasetId, versionId), 'data', params] as const,
  tags: () => [...datasetKeys.all, 'tags'] as const,
};

// Hooks for dataset operations
export function useDatasets<TData = Dataset[]>(
  params: DatasetListParams = {},
  options?: Omit<UseQueryOptions<Dataset[], Error, TData>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, Error> {
  return useQuery<Dataset[], Error, TData>({
    queryKey: datasetKeys.list(params),
    queryFn: () => api.datasets.getAll(params),
    ...options,
  });
}

export function usePaginatedDatasets(initialParams: DatasetListParams = { limit: 10, offset: 0 }) {
  const [params, setParams] = useState<DatasetListParams>(initialParams);
  const queryClient = useQueryClient();
  
  const queryResult = useDatasets(params, {
    select: (data): PaginatedResponse<DatasetInfo> => {
      const total = data.length === params.limit ? (params.offset || 0) + params.limit + 1 : (params.offset || 0) + data.length;
      return {
        items: data.map(mapApiResponseToDatasetInfo),
        total,
        page: Math.floor((params.offset || 0) / (params.limit || 10)) + 1,
        limit: params.limit || 10,
        hasMore: data.length === params.limit,
      };
    },
  });

  // Prefetch next page if we have more data
  const prefetchNextPage = () => {
    if (queryResult.data?.hasMore) {
      const nextPageParams = {
        ...params,
        offset: (params.offset || 0) + (params.limit || 10),
      };
      
      queryClient.prefetchQuery({
        queryKey: datasetKeys.list(nextPageParams),
        queryFn: () => api.datasets.getAll(nextPageParams),
      });
    }
  };

  // Pagination controls
  const goToNextPage = () => {
    if (queryResult.data?.hasMore) {
      setParams(prev => ({
        ...prev,
        offset: (prev.offset || 0) + (prev.limit || 10),
      }));
    }
  };

  const goToPrevPage = () => {
    setParams(prev => ({
      ...prev,
      offset: Math.max(0, (prev.offset || 0) - (prev.limit || 10)),
    }));
  };

  const goToPage = (page: number) => {
    setParams(prev => ({
      ...prev,
      offset: (page - 1) * (prev.limit || 10),
    }));
  };

  const setPageSize = (pageSize: number) => {
    setParams(prev => ({
      ...prev,
      limit: pageSize,
      offset: 0, // Reset to first page
    }));
  };

  // Filtering and sorting
  const setFilter = (key: keyof DatasetListParams, value: DatasetListParams[keyof DatasetListParams]) => { // Improved type for value
    setParams(prev => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset to first page when changing filters
    }));
  };

  const setSort = (field: string, order: 'asc' | 'desc') => {
    setParams(prev => ({
      ...prev,
      sort_by: field,
      sort_order: order,
      offset: 0, // Reset to first page when changing sort
    }));
  };

  // Search
  const setSearchTerm = (term: string) => {
    setParams(prev => ({
      ...prev,
      name: term,
      offset: 0, // Reset to first page when searching
    }));
  };

  return {
    ...queryResult,
    pagination: {
      currentPage: Math.floor((params.offset || 0) / (params.limit || 10)) + 1,
      pageSize: params.limit || 10,
      total: queryResult.data?.total || 0,
      hasNextPage: !!queryResult.data?.hasMore,
      hasPrevPage: (params.offset || 0) > 0,
      goToNextPage,
      goToPrevPage,
      goToPage,
      setPageSize,
      prefetchNextPage,
    },
    filtering: {
      params,
      setFilter,
      setSort,
      setSearchTerm,
      resetFilters: () => setParams(initialParams),
    },
  };
}

export function useDataset(id: number, options?: Omit<UseQueryOptions<Dataset, Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<Dataset, Error>({
    queryKey: datasetKeys.detail(id),
    queryFn: () => api.datasets.getById(id),
    enabled: !!id,
    ...options,
  });
}

export function useUpdateDataset(
  options?: Omit<UseMutationOptions<Dataset, Error, { id: number, data: DatasetUpdate }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation<Dataset, Error, { id: number, data: DatasetUpdate }>({
    mutationFn: ({ id, data }) => api.datasets.update(id, data),
    onSuccess: (data, variables) => {
      // Invalidate the specific dataset and the lists
      queryClient.invalidateQueries({ queryKey: datasetKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: datasetKeys.lists() });
      
      if (options?.onSuccess) {
        options.onSuccess(data, variables, undefined);
      }
    },
    ...options,
  });
}

export function useUploadDataset(
  options?: Omit<UseMutationOptions<DatasetUploadResponse, Error, DatasetUploadParams>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation<DatasetUploadResponse, Error, DatasetUploadParams>({
    mutationFn: (data) => api.datasets.upload(data),
    onSuccess: (data, _variables, _context) => { // Explicitly ignore variables and context if not used
      // Invalidate datasets lists and the specific dataset if updating
      queryClient.invalidateQueries({ queryKey: datasetKeys.lists() });
      if (data.dataset_id) {
        queryClient.invalidateQueries({ queryKey: datasetKeys.detail(data.dataset_id) });
      }
      
      if (options?.onSuccess) {
        options.onSuccess(data, undefined as any, undefined); // Kept as any for now, but ideally should be typed or handled
      }
    },
    ...options,
  });
}

export function useDatasetVersions(
  datasetId: number,
  options?: Omit<UseQueryOptions<DatasetVersion[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<DatasetVersion[], Error>({
    queryKey: datasetKeys.versions(datasetId),
    queryFn: () => api.datasets.versions.getAll(datasetId),
    enabled: !!datasetId,
    ...options,
  });
}

export function useDatasetVersion(
  datasetId: number,
  versionId: number,
  options?: Omit<UseQueryOptions<DatasetVersion, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<DatasetVersion, Error>({
    queryKey: datasetKeys.version(datasetId, versionId),
    queryFn: () => api.datasets.versions.getOne(datasetId, versionId),
    enabled: !!datasetId && !!versionId,
    ...options,
  });
}

export function useDeleteDatasetVersion(
  options?: Omit<UseMutationOptions<void, Error, { datasetId: number, versionId: number }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { datasetId: number, versionId: number }>({
    mutationFn: ({ datasetId, versionId }) => api.datasets.versions.delete(datasetId, versionId),
    onSuccess: (_, variables) => {
      // Invalidate the versions list and the dataset detail
      queryClient.invalidateQueries({ queryKey: datasetKeys.versions(variables.datasetId) });
      queryClient.invalidateQueries({ queryKey: datasetKeys.detail(variables.datasetId) });
      
      if (options?.onSuccess) {
        options.onSuccess(_, variables, undefined);
      }
    },
    ...options,
  });
}

export function useDatasetVersionSheets(
  datasetId: number,
  versionId: number,
  options?: Omit<UseQueryOptions<{ name: string, sheet_index: number, id: number }[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<{ name: string, sheet_index: number, id: number }[], Error>({
    queryKey: datasetKeys.sheets(datasetId, versionId),
    queryFn: () => api.datasets.versions.listSheets(datasetId, versionId),
    enabled: !!datasetId && !!versionId,
    ...options,
  });
}

export function useDatasetVersionData(
  datasetId: number,
  versionId: number,
  params?: SheetDataParams,
  options?: Omit<UseQueryOptions<{ columns: string[], data: unknown[][] }, Error>, 'queryKey' | 'queryFn'> // Changed any to unknown
) {
  return useQuery<{ columns: string[], data: unknown[][] }, Error>({ // Changed any to unknown
    queryKey: datasetKeys.sheetData(datasetId, versionId, params),
    queryFn: () => api.datasets.versions.getData(datasetId, versionId, params),
    enabled: !!datasetId && !!versionId,
    ...options,
  });
}

export function useTags(
  options?: Omit<UseQueryOptions<Tag[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Tag[], Error>({
    queryKey: datasetKeys.tags(),
    queryFn: () => api.datasets.getAllTags(),
    ...options,
  });
}


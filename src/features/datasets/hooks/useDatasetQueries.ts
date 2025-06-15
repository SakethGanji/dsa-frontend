import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBaseQuery, useBaseMutation } from '@/lib/query/hooks';
import { usePaginatedQuery } from '@/lib/query/hooks/usePaginatedQuery';
import { queryKeys, invalidateQueries } from '@/lib/query/queryKeys';
import { api } from '@/lib/api';
import type {
  Dataset,
  DatasetListParams,
  DatasetUpdate,
  DatasetUploadParams,
  DatasetUploadResponse,
  DatasetVersion,
  Tag,
  SheetDataParams,
} from '@/lib/api/types';
import { toast } from 'sonner';

/**
 * Hook for fetching all datasets
 */
export function useDatasets(params?: DatasetListParams) {
  return useBaseQuery({
    queryKey: queryKeys.datasets.list(params),
    queryFn: () => api.datasets.getAll(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching paginated datasets
 */
export function usePaginatedDatasets(
  initialPage = 1,
  initialPageSize = 10,
  filters?: Omit<DatasetListParams, 'page' | 'pageSize'>
) {
  return usePaginatedQuery({
    queryKey: (params) => queryKeys.datasets.list({ ...filters, ...params }),
    queryFn: (params) => api.datasets.getAll({ ...filters, ...params }),
    initialPage,
    initialPageSize,
  });
}

/**
 * Hook for fetching a single dataset
 */
export function useDataset(id: number | undefined) {
  return useBaseQuery({
    queryKey: queryKeys.datasets.detail(id!),
    queryFn: () => api.datasets.getById(id!),
    enabled: id !== undefined,
  });
}

/**
 * Hook for uploading a dataset
 */
export function useUploadDataset() {
  const queryClient = useQueryClient();
  
  return useBaseMutation({
    mutationFn: (params: DatasetUploadParams) => api.datasets.upload(params),
    onSuccess: (data: DatasetUploadResponse) => {
      // Invalidate dataset lists
      queryClient.invalidateQueries({ queryKey: queryKeys.datasets.lists() });
      
      // If this was a new version, invalidate the dataset detail
      if (data.dataset_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.datasets.detail(data.dataset_id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.datasets.versions(data.dataset_id) 
        });
      }
      
      toast.success('Dataset uploaded successfully');
    },
    onError: () => {
      toast.error('Failed to upload dataset');
    },
  });
}

/**
 * Hook for updating a dataset
 */
export function useUpdateDataset() {
  const queryClient = useQueryClient();
  
  return useBaseMutation({
    mutationFn: ({ id, data }: { id: number; data: DatasetUpdate }) => 
      api.datasets.update(id, data),
    onSuccess: (dataset: Dataset) => {
      // Update the cache optimistically
      queryClient.setQueryData(
        queryKeys.datasets.detail(dataset.id),
        dataset
      );
      
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.datasets.lists() });
      
      toast.success('Dataset updated successfully');
    },
  });
}

/**
 * Hook for deleting a dataset
 */
export function useDeleteDataset() {
  const queryClient = useQueryClient();
  
  return useBaseMutation({
    mutationFn: (id: number) => api.datasets.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.datasets.detail(id) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.datasets.lists() });
      
      toast.success('Dataset deleted successfully');
    },
  });
}

/**
 * Hook for fetching dataset versions
 */
export function useDatasetVersions(datasetId: number | undefined) {
  return useBaseQuery({
    queryKey: queryKeys.datasets.versions(datasetId!),
    queryFn: () => api.datasets.versions.getAll(datasetId!),
    enabled: datasetId !== undefined,
  });
}

/**
 * Hook for fetching a specific dataset version
 */
export function useDatasetVersion(
  datasetId: number | undefined,
  versionId: number | undefined
) {
  return useBaseQuery({
    queryKey: queryKeys.datasets.version(datasetId!, versionId!),
    queryFn: () => api.datasets.versions.getOne(datasetId!, versionId!),
    enabled: datasetId !== undefined && versionId !== undefined,
  });
}

/**
 * Hook for deleting a dataset version
 */
export function useDeleteDatasetVersion() {
  const queryClient = useQueryClient();
  
  return useBaseMutation({
    mutationFn: ({ datasetId, versionId }: { datasetId: number; versionId: number }) =>
      api.datasets.versions.delete(datasetId, versionId),
    onSuccess: (_, { datasetId, versionId }) => {
      // Invalidate version queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.datasets.versions(datasetId) 
      });
      
      // Invalidate related queries
      invalidateQueries.versionWithRelated(datasetId, versionId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      toast.success('Version deleted successfully');
    },
  });
}

/**
 * Hook for downloading a dataset version
 */
export function useDownloadDatasetVersion() {
  return useBaseMutation({
    mutationFn: ({ datasetId, versionId }: { datasetId: number; versionId: number }) =>
      api.datasets.versions.download(datasetId, versionId),
    onSuccess: (blob, { datasetId, versionId }) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dataset_${datasetId}_v${versionId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Download started');
    },
  });
}

/**
 * Hook for fetching dataset sheets
 */
export function useDatasetSheets(
  datasetId: number | undefined,
  versionId: number | undefined
) {
  return useBaseQuery({
    queryKey: queryKeys.datasets.sheets(datasetId!, versionId!),
    queryFn: () => api.datasets.versions.listSheets(datasetId!, versionId!),
    enabled: datasetId !== undefined && versionId !== undefined,
  });
}

/**
 * Hook for fetching dataset sheet data
 */
export function useDatasetSheetData(
  datasetId: number | undefined,
  versionId: number | undefined,
  params?: SheetDataParams
) {
  return useBaseQuery({
    queryKey: queryKeys.datasets.sheetData(datasetId!, versionId!, params),
    queryFn: () => api.datasets.versions.getData(datasetId!, versionId!, params),
    enabled: datasetId !== undefined && versionId !== undefined,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching all dataset tags
 */
export function useDatasetTags() {
  return useBaseQuery({
    queryKey: queryKeys.datasets.tags(),
    queryFn: api.datasets.getAllTags,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for prefetching dataset data
 */
export function usePrefetchDataset() {
  const queryClient = useQueryClient();
  
  return useCallback((id: number) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.datasets.detail(id),
      queryFn: () => api.datasets.getById(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }, [queryClient]);
}

/**
 * Hook for prefetching dataset versions
 */
export function usePrefetchDatasetVersions() {
  const queryClient = useQueryClient();
  
  return useCallback((datasetId: number) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.datasets.versions(datasetId),
      queryFn: () => api.datasets.versions.getAll(datasetId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }, [queryClient]);
}
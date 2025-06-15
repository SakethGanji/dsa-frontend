import { useQueryClient } from '@tanstack/react-query';
import { useBaseQuery, useBaseMutation } from '@/lib/query/hooks';
import { queryKeys } from '@/lib/query/queryKeys';
import { api } from '@/lib/api';
import type { ExploreRequest } from '@/lib/api/types';
import { toast } from 'sonner';

/**
 * Hook for running data exploration
 */
export function useExploreData(
  datasetId: number | undefined,
  versionId: number | undefined,
  options?: ExploreRequest,
  enabled = true
) {
  return useBaseQuery({
    queryKey: queryKeys.exploration.detail(datasetId!, versionId!, options),
    queryFn: () => api.explore.runExplore(datasetId!, versionId!, options!),
    enabled: enabled && datasetId !== undefined && versionId !== undefined && options !== undefined,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for running data exploration as a mutation
 */
export function useExploreDataMutation() {
  const queryClient = useQueryClient();
  
  return useBaseMutation({
    mutationFn: ({ 
      datasetId, 
      versionId, 
      options 
    }: { 
      datasetId: number; 
      versionId: number; 
      options: ExploreRequest;
    }) => api.explore.runExplore(datasetId, versionId, options),
    onSuccess: (data, { datasetId, versionId, options }) => {
      // Cache the result
      queryClient.setQueryData(
        queryKeys.exploration.detail(datasetId, versionId, options),
        data
      );
      toast.success('Exploration completed');
    },
    onError: () => {
      toast.error('Exploration failed');
    },
  });
}

/**
 * Hook for getting dataset preview for exploration
 */
export function useDatasetPreview(
  datasetId: number | undefined,
  versionId: number | undefined
) {
  return useBaseQuery({
    queryKey: queryKeys.exploration.preview(datasetId!, versionId!),
    queryFn: async () => {
      // Use the sheet data endpoint to get a preview
      const result = await api.datasets.versions.getData(datasetId!, versionId!, {
        page: 1,
        pageSize: 100, // Preview with first 100 rows
      });
      return result;
    },
    enabled: datasetId !== undefined && versionId !== undefined,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for getting column statistics
 */
export function useColumnStatistics(
  datasetId: number | undefined,
  versionId: number | undefined,
  columnName?: string
) {
  return useBaseQuery({
    queryKey: queryKeys.exploration.statistics(datasetId!, versionId!, columnName),
    queryFn: async () => {
      // Run exploration to get statistics
      const options: ExploreRequest = {
        columns: columnName ? [columnName] : undefined,
        aggregations: ['count', 'mean', 'min', 'max', 'std'],
      };
      return api.explore.runExplore(datasetId!, versionId!, options);
    },
    enabled: datasetId !== undefined && versionId !== undefined,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for invalidating exploration cache
 */
export function useInvalidateExploration() {
  const queryClient = useQueryClient();
  
  return (datasetId: number, versionId: number) => {
    queryClient.invalidateQueries({
      queryKey: [...queryKeys.exploration.all, datasetId, versionId],
    });
  };
}
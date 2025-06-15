import { useQueryClient } from '@tanstack/react-query';
import { useBaseQuery, useBaseMutation } from '@/lib/query/hooks';
import { queryKeys } from '@/lib/query/queryKeys';
import { api } from '@/lib/api';
import type { 
  SamplingRequest, 
  SamplingResult,
  MultiRoundSamplingRequest,
  MultiRoundSamplingResponse 
} from '@/lib/api/types';
import { toast } from 'sonner';

/**
 * Hook for executing sampling
 */
export function useSampling(
  datasetId: number | undefined,
  versionId: number | undefined,
  request?: SamplingRequest,
  page?: number,
  pageSize?: number,
  enabled = true
) {
  return useBaseQuery({
    queryKey: queryKeys.sampling.execute(datasetId!, versionId!, { ...request, page, pageSize }),
    queryFn: () => api.sampling.execute(datasetId!, versionId!, request!, page, pageSize),
    enabled: enabled && datasetId !== undefined && versionId !== undefined && request !== undefined,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for executing sampling as a mutation
 */
export function useSamplingMutation() {
  const queryClient = useQueryClient();
  
  return useBaseMutation({
    mutationFn: async ({ 
      datasetId, 
      versionId, 
      request,
      page,
      pageSize
    }: { 
      datasetId: number; 
      versionId: number; 
      request: SamplingRequest;
      page?: number;
      pageSize?: number;
    }) => {
      const result = await api.sampling.execute(datasetId, versionId, request, page, pageSize);
      return { result, params: { datasetId, versionId, request, page, pageSize } };
    },
    onSuccess: ({ result, params }) => {
      // Cache the result
      queryClient.setQueryData(
        queryKeys.sampling.execute(params.datasetId, params.versionId, {
          ...params.request,
          page: params.page,
          pageSize: params.pageSize
        }),
        result
      );
      toast.success('Sampling completed');
    },
    onError: () => {
      toast.error('Sampling failed');
    },
  });
}

/**
 * Hook for getting sampling columns metadata
 */
export function useSamplingColumns(
  datasetId: number | undefined,
  versionId: number | undefined
) {
  return useBaseQuery({
    queryKey: queryKeys.sampling.columns(datasetId!, versionId!),
    queryFn: () => api.sampling.getColumns(datasetId!, versionId!),
    enabled: datasetId !== undefined && versionId !== undefined,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for executing multi-round sampling
 */
export function useMultiRoundSampling(
  datasetId: number | undefined,
  versionId: number | undefined,
  request?: MultiRoundSamplingRequest,
  page?: number,
  pageSize?: number,
  enabled = true
) {
  return useBaseQuery({
    queryKey: queryKeys.sampling.multiRound.execute(datasetId!, versionId!, { ...request, page, pageSize }),
    queryFn: () => api.sampling.executeMultiRound(datasetId!, versionId!, request!, page, pageSize),
    enabled: enabled && datasetId !== undefined && versionId !== undefined && request !== undefined,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for executing multi-round sampling as a mutation
 */
export function useMultiRoundSamplingMutation() {
  const queryClient = useQueryClient();
  
  return useBaseMutation({
    mutationFn: ({ 
      datasetId, 
      versionId, 
      request,
      page,
      pageSize
    }: { 
      datasetId: number; 
      versionId: number; 
      request: MultiRoundSamplingRequest;
      page?: number;
      pageSize?: number;
    }) => api.sampling.executeMultiRound(datasetId, versionId, request, page, pageSize),
    onSuccess: (data, variables) => {
      // Cache the result
      queryClient.setQueryData(
        queryKeys.sampling.multiRound.execute(
          variables.datasetId, 
          variables.versionId, 
          { ...variables.request, page: variables.page, pageSize: variables.pageSize }
        ),
        data
      );
      toast.success('Multi-round sampling completed');
    },
    onError: () => {
      toast.error('Multi-round sampling failed');
    },
  });
}

/**
 * Hook for getting multi-round sampling history
 */
export function useMultiRoundSamplingHistory(
  datasetId: number | undefined,
  versionId: number | undefined
) {
  return useBaseQuery({
    queryKey: queryKeys.sampling.multiRound.history(datasetId!, versionId!),
    queryFn: async () => {
      // This would need a backend endpoint to fetch history
      // For now, return empty array
      return [];
    },
    enabled: datasetId !== undefined && versionId !== undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for invalidating sampling cache
 */
export function useInvalidateSampling() {
  const queryClient = useQueryClient();
  
  return (datasetId: number, versionId: number) => {
    queryClient.invalidateQueries({
      queryKey: [...queryKeys.sampling.all, 'execute', datasetId, versionId],
    });
    queryClient.invalidateQueries({
      queryKey: [...queryKeys.sampling.multiRound.all, 'execute', datasetId, versionId],
    });
  };
}
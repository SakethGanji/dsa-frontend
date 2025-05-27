import { 
  useMutation, 
  type UseMutationOptions,
} from '@tanstack/react-query';
import { api } from '@/lib/api/index';
import type { SamplingRequest, SamplingResult } from '@/lib/api/types';

// Query keys for sampling
export const samplingKeys = {
  all: ['sampling'] as const,
  detail: (datasetId: number, versionId: number) => 
    [...samplingKeys.all, datasetId, versionId] as const,
};

/**
 * Hook to execute sampling operations on a dataset version
 */
export function useSampling(
  options?: Omit<UseMutationOptions<SamplingResult[], Error, {
    datasetId: number,
    versionId: number, 
    request: SamplingRequest,
    page?: number,
    pageSize?: number
  }, unknown>, 'mutationFn'>
) {
  return useMutation<SamplingResult[], Error, {
    datasetId: number,
    versionId: number, 
    request: SamplingRequest,
    page?: number,
    pageSize?: number
  }>({
    mutationFn: ({ datasetId, versionId, request, page, pageSize }) => 
      api.sampling.execute(datasetId, versionId, request, page || 1, pageSize || 100),
    ...options,
  });
}

/**
 * Helper functions for creating sampling requests
 */
export const samplingHelpers = {
  random: (sampleSize: number, outputName: string, seed?: number): SamplingRequest => ({
    method: 'random',
    parameters: {
      sample_size: sampleSize,
      ...(seed !== undefined && { seed }),
    },
    output_name: outputName,
  }),

  stratified: (
    strataColumns: string[], 
    outputName: string,
    sampleSize?: number,
    minPerStratum?: number,
    seed?: number
  ): SamplingRequest => ({
    method: 'stratified',
    parameters: {
      strata_columns: strataColumns,
      ...(sampleSize !== undefined && { sample_size: sampleSize }),
      ...(minPerStratum !== undefined && { min_per_stratum: minPerStratum }),
      ...(seed !== undefined && { seed }),
    },
    output_name: outputName,
  }),

  systematic: (interval: number, outputName: string, start?: number): SamplingRequest => ({
    method: 'systematic',
    parameters: {
      interval,
      ...(start !== undefined && { start }),
    },
    output_name: outputName,
  }),

  cluster: (
    clusterColumn: string,
    numClusters: number,
    outputName: string,
    sampleWithinClusters?: number
  ): SamplingRequest => ({
    method: 'cluster',
    parameters: {
      cluster_column: clusterColumn,
      num_clusters: numClusters,
      ...(sampleWithinClusters !== undefined && { sample_within_clusters: sampleWithinClusters }),
    },
    output_name: outputName,
  }),

  custom: (query: string, outputName: string): SamplingRequest => ({
    method: 'custom',
    parameters: {
      query,
    },
    output_name: outputName,
  }),
};
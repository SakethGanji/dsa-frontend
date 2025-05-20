import { 
  useMutation, 
  type UseMutationOptions, // Use type-only import
} from '@tanstack/react-query';
import { api } from '@/lib/api/index'; // Corrected import path
import type { ExploreRequest } from '@/lib/api/types';

// Query keys for exploration
export const explorationKeys = {
  all: ['explore'] as const,
  detail: (datasetId: number, versionId: number) => 
    [...explorationKeys.all, datasetId, versionId] as const,
};

/**
 * Hook to run dataset exploration operations like filtering, sampling, 
 * and profiling on a dataset version
 */
export function useExploreDataset<TData = unknown>(
  options?: Omit<UseMutationOptions<unknown, Error, {
    datasetId: number,
    versionId: number, 
    options: ExploreRequest 
  }, unknown>, 'mutationFn'>
) {
  return useMutation<unknown, Error, {
    datasetId: number,
    versionId: number, 
    options: ExploreRequest 
  }>({
    mutationFn: ({ datasetId, versionId, options }) => 
      api.explore.runExplore(datasetId, versionId, options),
    ...options,
  });
}

/**
 * Helper type for operation parameters
 */
export type Operation = {
  type: string;
  [key: string]: unknown; // Changed any to unknown
};

/**
 * Helper functions for common exploration operations
 */
export const explorationOperations = {
  /**
   * Filter rows using a pandas query expression
   */
  filterRows: (query: string): Operation => ({
    type: 'filter_rows',
    query,
  }),

  /**
   * Sample rows with various methods
   */
  sampleRows: (n: number, method: 'random' | 'head' | 'tail' = 'random'): Operation => ({
    type: 'sample_rows',
    n,
    method,
  }),

  /**
   * Remove specified columns
   */
  removeColumns: (columns: string[]): Operation => ({
    type: 'remove_columns',
    columns,
  }),

  /**
   * Rename columns using a mapping
   */
  renameColumns: (mapping: Record<string, string>): Operation => ({
    type: 'rename_columns',
    mapping,
  }),

  /**
   * Remove rows with null values in specified columns
   */
  removeNulls: (columns: string[]): Operation => ({
    type: 'remove_nulls',
    columns,
  }),

  /**
   * Create a new column using an expression
   */
  deriveColumn: (name: string, expression: string): Operation => ({
    type: 'derive_column',
    name,
    expression,
  }),

  /**
   * Sort rows by specified columns
   */
  sortRows: (columns: string[], ascending: boolean = true): Operation => ({
    type: 'sort_rows',
    columns,
    ascending,
  }),
};

/**
 * Helper function to create exploration options
 */
export function createExploreOptions(
  operations: Operation[],
  options: Partial<ExploreRequest> = {}
): ExploreRequest {
  return {
    operations,
    format: options.format || 'json',
    run_profiling: options.run_profiling || false,
    sheet: options.sheet || null,
  };
}

/**
 * Simplified helper to create profile-only request
 */
export function createProfileRequest(format: string = 'html'): ExploreRequest {
  return {
    format,
    run_profiling: true,
    operations: [],
    sheet: null
  };
}


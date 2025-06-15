import type { QueryKeyFactory } from './types';

// Type-safe parameter types for query keys
interface DatasetListParams {
  search?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface SheetDataParams {
  sheetName?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: Record<string, unknown>;
}

interface ExploreParams {
  columns?: string[];
  filters?: Record<string, unknown>;
  aggregations?: string[];
}

interface SamplingParams {
  sampleSize?: number;
  method?: string;
  seed?: number;
  columns?: string[];
}

interface MultiRoundSamplingParams extends SamplingParams {
  rounds?: number;
  roundConfig?: Record<string, unknown>;
}

// Comprehensive query key factory
export const queryKeys = {
  // Auth/User queries
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    users: {
      all: ['users'] as const,
      lists: () => [...queryKeys.auth.users.all, 'list'] as const,
      list: (filters?: { search?: string; role?: string }) => 
        [...queryKeys.auth.users.lists(), filters] as const,
      detail: (id: string | number) => 
        [...queryKeys.auth.users.all, 'detail', id] as const,
    },
  },
  
  // Dataset queries
  datasets: {
    all: ['datasets'] as const,
    lists: () => [...queryKeys.datasets.all, 'list'] as const,
    list: (filters: DatasetListParams = {}) => 
      [...queryKeys.datasets.lists(), filters] as const,
    details: () => [...queryKeys.datasets.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.datasets.details(), id] as const,
    
    // Dataset versions
    versions: (datasetId: number) => 
      [...queryKeys.datasets.detail(datasetId), 'versions'] as const,
    version: (datasetId: number, versionId: number) => 
      [...queryKeys.datasets.versions(datasetId), versionId] as const,
    
    // Dataset sheets
    sheets: (datasetId: number, versionId: number) => 
      [...queryKeys.datasets.version(datasetId, versionId), 'sheets'] as const,
    sheetData: (datasetId: number, versionId: number, params?: SheetDataParams) => 
      [...queryKeys.datasets.version(datasetId, versionId), 'data', params] as const,
    
    // Dataset metadata
    tags: () => [...queryKeys.datasets.all, 'tags'] as const,
    columnMetadata: (datasetId: number, versionId: number) => 
      [...queryKeys.datasets.version(datasetId, versionId), 'columnMetadata'] as const,
  },
  
  // Data exploration queries
  exploration: {
    all: ['explore'] as const,
    lists: () => [...queryKeys.exploration.all, 'list'] as const,
    detail: (datasetId: number, versionId: number, params?: ExploreParams) => 
      [...queryKeys.exploration.all, datasetId, versionId, params] as const,
    preview: (datasetId: number, versionId: number) => 
      [...queryKeys.exploration.all, 'preview', datasetId, versionId] as const,
    statistics: (datasetId: number, versionId: number, column?: string) => 
      [...queryKeys.exploration.all, 'statistics', datasetId, versionId, column] as const,
  },
  
  // Sampling queries
  sampling: {
    all: ['sampling'] as const,
    execute: (datasetId: number, versionId: number, params?: SamplingParams) => 
      [...queryKeys.sampling.all, 'execute', datasetId, versionId, params] as const,
    columns: (datasetId: number, versionId: number) => 
      [...queryKeys.sampling.all, 'columns', datasetId, versionId] as const,
    multiRound: {
      all: ['sampling', 'multi-round'] as const,
      execute: (datasetId: number, versionId: number, params?: MultiRoundSamplingParams) => 
        [...queryKeys.sampling.multiRound.all, 'execute', datasetId, versionId, params] as const,
      history: (datasetId: number, versionId: number) => 
        [...queryKeys.sampling.multiRound.all, 'history', datasetId, versionId] as const,
    },
  },
  
  // Column metadata queries (separate for better caching)
  columnMetadata: {
    all: ['column-metadata'] as const,
    detail: (datasetId: number, versionId: number) => 
      [...queryKeys.columnMetadata.all, datasetId, versionId] as const,
    statistics: (datasetId: number, versionId: number, columnName: string) => 
      [...queryKeys.columnMetadata.detail(datasetId, versionId), 'stats', columnName] as const,
  },
  
  // File operations
  files: {
    all: ['files'] as const,
    download: (datasetId: number, versionId: number) => 
      [...queryKeys.files.all, 'download', datasetId, versionId] as const,
    upload: () => [...queryKeys.files.all, 'upload'] as const,
  },
} as const;

// Generic query key factory creator for extensions
export const createQueryKeyFactory = (
  baseKey: string,
  options?: {
    lists?: boolean;
    details?: boolean;
    filters?: boolean;
  }
): QueryKeyFactory => {
  const factory: QueryKeyFactory = {
    all: [baseKey],
  };

  if (options?.lists !== false) {
    factory.lists = () => [baseKey, 'list'];
    if (options?.filters !== false) {
      factory.list = (params = {}) => [baseKey, 'list', params];
    }
  }

  if (options?.details !== false) {
    factory.details = () => [baseKey, 'detail'];
    factory.detail = (id) => [baseKey, 'detail', id];
  }

  return factory;
};

// Utility functions for query key management
export const invalidateQueries = {
  // Invalidate all queries for a resource
  all: (resource: keyof typeof queryKeys) => queryKeys[resource].all,
  
  // Invalidate list queries
  lists: (resource: 'datasets' | 'exploration') => {
    if (resource === 'datasets' || resource === 'exploration') {
      return queryKeys[resource].lists();
    }
    return queryKeys[resource].all;
  },
  
  // Invalidate specific detail
  detail: (resource: 'datasets', id: number) => 
    queryKeys[resource].detail(id),
  
  // Invalidate dataset and all its related queries
  datasetWithRelated: (datasetId: number) => [
    queryKeys.datasets.detail(datasetId),
    queryKeys.datasets.versions(datasetId),
    // This will invalidate all exploration queries for this dataset
    [...queryKeys.exploration.all, datasetId],
    // This will invalidate all sampling queries for this dataset
    [...queryKeys.sampling.all, 'execute', datasetId],
    [...queryKeys.sampling.all, 'columns', datasetId],
  ],
  
  // Invalidate specific version and related queries
  versionWithRelated: (datasetId: number, versionId: number) => [
    queryKeys.datasets.version(datasetId, versionId),
    queryKeys.datasets.sheets(datasetId, versionId),
    queryKeys.exploration.detail(datasetId, versionId),
    queryKeys.sampling.execute(datasetId, versionId),
    queryKeys.columnMetadata.detail(datasetId, versionId),
  ],
};

// Type helpers for query keys
export type QueryKeys = typeof queryKeys;
export type InvalidateQueries = typeof invalidateQueries;
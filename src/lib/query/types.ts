import type { UseQueryOptions, UseMutationOptions, QueryKey } from '@tanstack/react-query';

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

export type QueryConfig<TData = unknown, TError = ApiError> = Omit<
  UseQueryOptions<TData, TError>,
  'queryKey' | 'queryFn'
>;

export type MutationConfig<TData = unknown, TError = ApiError, TVariables = unknown> = Omit<
  UseMutationOptions<TData, TError, TVariables>,
  'mutationFn'
>;

export interface QueryKeyFactory {
  all: QueryKey;
  lists?: () => QueryKey;
  list?: (params?: Record<string, unknown>) => QueryKey;
  details?: () => QueryKey;
  detail?: (id: string | number) => QueryKey;
}
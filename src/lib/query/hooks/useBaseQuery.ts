import { 
  useQuery, 
  type QueryKey, 
  type UseQueryOptions,
  type UseQueryResult 
} from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/core';

interface UseBaseQueryOptions<
  TQueryFnData = unknown,
  TError = ApiError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
> extends Omit<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'queryKey' | 'queryFn'
> {
  queryKey: TQueryKey;
  queryFn: () => Promise<TQueryFnData>;
}

/**
 * Enhanced base query hook with proper TypeScript support
 * 
 * @example
 * ```ts
 * const { data, isLoading } = useBaseQuery({
 *   queryKey: ['users', userId],
 *   queryFn: () => api.users.getById(userId),
 *   enabled: !!userId,
 * });
 * ```
 */
export function useBaseQuery<
  TQueryFnData = unknown,
  TError = ApiError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  options: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): UseQueryResult<TData, TError> {
  const { queryKey, queryFn, ...queryOptions } = options;

  return useQuery({
    queryKey,
    queryFn,
    ...queryOptions,
  });
}

/**
 * Type-safe query configuration helper
 */
export type QueryConfig<
  TQueryFnData = unknown,
  TError = ApiError,
  TData = TQueryFnData
> = Omit<
  UseQueryOptions<TQueryFnData, TError, TData>,
  'queryKey' | 'queryFn'
>;
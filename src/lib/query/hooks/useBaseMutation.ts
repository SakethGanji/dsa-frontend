import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
  type QueryKey,
} from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/core';

interface UseBaseMutationOptions<
  TData = unknown,
  TError = ApiError,
  TVariables = void,
  TContext = unknown
> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateQueries?: QueryKey | QueryKey[];
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => void;
  onMutate?: (variables: TVariables) => Promise<TContext | undefined> | TContext | undefined;
}

/**
 * Enhanced base mutation hook with automatic query invalidation
 * 
 * @example
 * ```ts
 * const mutation = useBaseMutation({
 *   mutationFn: (data) => api.users.update(data),
 *   invalidateQueries: [['users'], ['users', userId]],
 *   onSuccess: (data) => {
 *     toast.success('User updated successfully');
 *   },
 * });
 * ```
 */
export function useBaseMutation<
  TData = unknown,
  TError = ApiError,
  TVariables = void,
  TContext = unknown
>(
  options: UseBaseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const queryClient = useQueryClient();
  const {
    mutationFn,
    invalidateQueries,
    onSuccess,
    onError,
    onSettled,
    onMutate,
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    onMutate,
    onSuccess: async (data, variables, context) => {
      // Invalidate queries
      if (invalidateQueries) {
        const queries = Array.isArray(invalidateQueries) ? invalidateQueries : [invalidateQueries];
        await Promise.all(
          queries.map(queryKey => queryClient.invalidateQueries({ queryKey }))
        );
      }
      
      // Call original onSuccess
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Call original onError
      onError?.(error, variables, context);
    },
    onSettled: async (data, error, variables, context) => {
      // Always refetch after mutation settles
      if (invalidateQueries) {
        const queries = Array.isArray(invalidateQueries) ? invalidateQueries : [invalidateQueries];
        await Promise.all(
          queries.map(queryKey => queryClient.invalidateQueries({ queryKey }))
        );
      }
      
      // Call original onSettled
      onSettled?.(data, error, variables, context);
    },
  });
}

/**
 * Type-safe mutation configuration helper
 */
export type MutationConfig<
  TData = unknown,
  TError = ApiError,
  TVariables = void,
  TContext = unknown
> = Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  'mutationFn'
>;
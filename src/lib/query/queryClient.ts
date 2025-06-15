import { QueryClient, MutationCache, QueryCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError, NetworkError, AuthenticationError } from '../api/core';

// Error handler for queries and mutations
const handleError = (error: unknown): void => {
  if (error instanceof ApiError) {
    if (error instanceof AuthenticationError) {
      // Handle authentication errors - will be caught by auth service
      console.error('Authentication error:', error.message);
    } else if (error instanceof NetworkError) {
      toast.error('Network error. Please check your connection.');
    } else {
      // Show user-friendly error messages
      const details = error.details as any;
      const message = details?.detail || details?.message || error.message || 'An error occurred';
      toast.error(message);
    }
  } else if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred');
  }
};

// Create query client with comprehensive configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof ApiError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      
      // Cache configuration
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      
      // Network mode
      networkMode: 'online',
    },
    mutations: {
      retry: false, // Don't retry mutations by default
      networkMode: 'online',
    },
  },
  
  // Global error handling
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show error toast if this is a user-initiated query
      if (query.state.dataUpdateCount > 0) {
        handleError(error);
      }
    },
  }),
  
  mutationCache: new MutationCache({
    onError: (error) => {
      handleError(error);
    },
  }),
});

// Utility function to reset specific queries
export const resetQueries = (queryKey?: unknown[]) => {
  if (queryKey) {
    queryClient.resetQueries({ queryKey });
  } else {
    queryClient.clear();
  }
};

// Utility function to prefetch queries
export const prefetchQuery = async <T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  staleTime?: number
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: staleTime ?? 5 * 60 * 1000, // Default 5 minutes
  });
};

// Export query client instance
export default queryClient;
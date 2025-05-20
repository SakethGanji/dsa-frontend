import { 
  useMutation, 
  useQuery, 
  useQueryClient,
  type UseMutationOptions, // Use type-only import
  type UseQueryOptions // Use type-only import
} from '@tanstack/react-query';
import { api } from '@/lib/api/index'; // Corrected import path
import {
  saveTokens,
  removeTokens, 
  // getUserFromToken // Removed unused import
} from '@/lib/auth';
import type { 
  Token, 
  LoginRequest, 
  UserCreate, 
  UserOut 
} from '@/lib/api/types';
import { useAuth } from '@/components/providers/auth-provider';

// Query keys for authentication
export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  users: () => [...authKeys.all, 'users'] as const,
};

/**
 * Hook for user login
 */
export function useLogin(
  options?: Omit<UseMutationOptions<Token, Error, LoginRequest>, 'mutationFn'>
) {
  const { login } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation<Token, Error, LoginRequest>({
    mutationFn: (credentials) => api.auth.login(credentials),
    onSuccess: (data, variables, context) => {
      // Save tokens and update auth context
      saveTokens(data);
      login(data);
      
      // Clear and refetch user-related queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

/**
 * Hook for user registration
 */
export function useRegister(
  options?: Omit<UseMutationOptions<UserOut, Error, UserCreate>, 'mutationFn'>
) {
  return useMutation<UserOut, Error, UserCreate>({
    mutationFn: (userData) => api.users.register(userData),
    ...options,
  });
}

/**
 * Hook to check if the current session is valid
 */
export function useSession(
  options?: Omit<UseQueryOptions<UserOut, Error>, 'queryKey' | 'queryFn'>
) {
  const { isAuthenticated, logout } = useAuth();
  
  return useQuery<UserOut, Error>({
    queryKey: authKeys.session(),
    queryFn: async () => {
      try {
        return await api.auth.validateSession();
      } catch (error) {
        // If the session is invalid, log the user out
        logout();
        throw error;
      }
    },
    // Only run if authenticated
    enabled: isAuthenticated,
    // Don't retry auth failures
    retry: false,
    // Keep for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
    ...options,
  });
}

/**
 * Hook to get all users (admin only)
 */
export function useUsers(
  options?: Omit<UseQueryOptions<UserOut[], Error>, 'queryKey' | 'queryFn'>
) {
  const { isAuthenticated } = useAuth();
  
  return useQuery<UserOut[], Error>({
    queryKey: authKeys.users(),
    queryFn: () => api.users.getAll(),
    enabled: isAuthenticated,
    ...options,
  });
}

/**
 * Hook to create a new user (admin only)
 */
export function useCreateUser(
  options?: Omit<UseMutationOptions<UserOut, Error, UserCreate>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation<UserOut, Error, UserCreate>({
    mutationFn: (userData) => api.users.create(userData),
    onSuccess: (data, variables, context) => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: authKeys.users() });
      
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

/**
 * Hook to log out the current user
 */
export function useLogout() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  
  return () => {
    // Clear tokens and auth state
    removeTokens();
    logout();
    
    // Reset query client cache
    queryClient.clear();
  };
}

/**
 * Hook to get current authentication status
 */
export function useAuthStatus() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // If we're not loading and not authenticated, we're logged out
  const isLoggedOut = !isLoading && !isAuthenticated;
  
  return {
    isAuthenticated,
    isLoading,
    isLoggedOut,
    user,
  };
}


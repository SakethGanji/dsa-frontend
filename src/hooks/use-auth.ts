import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query';
import { authApi } from '../lib/api';
import { loginUser } from '../lib/auth';
import type { AuthTokens, LoginCredentials } from '../types/auth';
import { useAuth } from '../components/providers/auth-provider';

// Authentication-related query keys
export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

// Define options type for useLogin, extending standard mutation options
// TData = AuthTokens (data returned by mutationFn)
// TError = Error (type of error)
// TVariables = LoginCredentials (variables passed to mutationFn)
// TContext = unknown (context from onMutate)
type UseLoginOptions = Omit<UseMutationOptions<AuthTokens, Error, LoginCredentials, unknown>, 'mutationFn'>;

// Hook for user login
export function useLogin(options?: UseLoginOptions) {
  const { login } = useAuth();
  
  return useMutation<AuthTokens, Error, LoginCredentials, unknown>({
    mutationFn: async (credentials: LoginCredentials) => {
      const tokens = await loginUser(credentials.username, credentials.password);
      return tokens;
    },
    // Spread other properties from options, but handle onSuccess explicitly
    ...options,
    onSuccess: (data, variables, context) => {
      login(data); // Call the login from AuthContext
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context); // Call the onSuccess from options
      }
    },
  });
}

// Hook to check if the current session is valid
export function useSession(options = {}) {
  const { isAuthenticated, logout } = useAuth();
  
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: async () => {
      // Only fetch if we have a token
      if (!isAuthenticated) {
        return { valid: false };
      }
      
      try {
        return await authApi.validateSession();
      } catch (error) {
        // If the session is invalid, log the user out
        logout();
        throw error;
      }
    },
    // Don't auto-retry auth failures
    retry: false,
    // Only run this query if we're authenticated
    enabled: isAuthenticated,
    // Keep the data for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Don't refetch on window focus for auth status
    refetchOnWindowFocus: false,
    ...options,
  });
}

// Hook to easily get current authentication status
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


import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBaseQuery, useBaseMutation } from '@/lib/query/hooks';
import { queryKeys } from '@/lib/query/queryKeys';
import { api } from '@/lib/api';
import type { LoginRequest, Token, UserOut, UserCreate } from '@/lib/api/types';
import { toast } from 'sonner';

/**
 * Hook for user login
 */
export function useLogin() {
  const queryClient = useQueryClient();
  
  return useBaseMutation({
    mutationFn: (credentials: LoginRequest) => api.auth.login(credentials),
    onSuccess: (data: Token) => {
      // Store tokens
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      toast.success('Logged in successfully');
    },
    onError: () => {
      toast.error('Invalid credentials');
    },
  });
}

/**
 * Hook for user logout
 */
export function useLogout() {
  const queryClient = useQueryClient();
  
  return useCallback(() => {
    // Clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Clear all queries
    queryClient.clear();
    
    // Redirect to login
    window.location.href = '/login';
  }, [queryClient]);
}

/**
 * Hook for refreshing authentication token
 */
export function useRefreshToken() {
  return useBaseMutation({
    mutationFn: (refreshToken: string) => api.auth.refreshToken(refreshToken),
    onSuccess: (data: Token) => {
      // Update tokens
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
    },
  });
}

/**
 * Hook for getting current user session
 */
export function useSession() {
  return useBaseQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: api.auth.validateSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Hook for getting current user
 */
export function useCurrentUser() {
  return useBaseQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: api.auth.validateSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for user registration
 */
export function useRegister() {
  return useBaseMutation({
    mutationFn: (userData: UserCreate) => api.users.register(userData),
    onSuccess: () => {
      toast.success('Registration successful! Please log in.');
    },
    onError: () => {
      toast.error('Registration failed. Please try again.');
    },
  });
}

/**
 * Hook for getting all users (admin only)
 */
export function useUsers() {
  return useBaseQuery({
    queryKey: queryKeys.auth.users.all,
    queryFn: api.users.getAll,
  });
}

/**
 * Hook for creating a new user (admin only)
 */
export function useCreateUser() {
  return useBaseMutation({
    mutationFn: (userData: UserCreate) => api.users.create(userData),
    invalidateQueries: queryKeys.auth.users.all,
    onSuccess: () => {
      toast.success('User created successfully');
    },
  });
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { data: user, isLoading } = useCurrentUser();
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}
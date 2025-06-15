import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { authService } from './authService';
import type { AuthState, LoginCredentials, AuthMachineState } from './types';

export function useAuth() {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>(() => {
    const machineState = authService.getStateMachine().getState();
    return {
      isAuthenticated: authService.isAuthenticated(),
      isLoading: authService.getStateMachine().isLoading(),
      user: machineState.context.user,
      error: machineState.context.error,
    };
  });

  useEffect(() => {
    const unsubscribe = authService.getStateMachine().subscribe((machineState: AuthMachineState) => {
      setState({
        isAuthenticated: authService.isAuthenticated(),
        isLoading: authService.getStateMachine().isLoading(),
        user: machineState.context.user,
        error: machineState.context.error,
      });
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      await authService.login(credentials);
      navigate({ to: '/' });
    } catch {
      // Error is handled by the state machine
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      navigate({ to: '/login' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [navigate]);

  const refreshAuth = useCallback(async () => {
    try {
      await authService.refreshTokens();
    } catch {
      // Error is handled by the state machine
    }
  }, []);

  const clearError = useCallback(() => {
    authService.clearError();
  }, []);

  return {
    ...state,
    login,
    logout,
    refreshAuth,
    clearError,
  };
}

export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: redirectTo });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return { isAuthenticated, isLoading };
}

export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}